var fs = require('fs');
var path = require('path');

var webpack = require('webpack');
var walk = require('walk');

var Format = require('./format');

/**
 * Produce a much slimmer version of webpack stats containing only information
 * that you would be interested in when creating an asset manifest.

 * @param {string} output - The output file path.
 * @param {object} options - Options to configure this plugin.
 */
var ManifestRevisionPlugin = function (output, options) {
    this.output = output;
    this.options = options;

    // Set sane defaults for any options.
    this.options.rootAssetPath = options.rootAssetPath || './';
    this.options.ignorePaths = options.ignorePaths || [];
    this.options.extensionsRegex = options.extensionsRegex || null;
    this.options.format = options.format || 'general';
};

/**
 * When given a logical asset path, produce an array that contains the logical
 * path of the asset without the cache hash included as the first element.
 * The second element contains the cached version of the asset name.

 * @param {string} logicalAssetPath - The path of the asset without the root.
 * @param {string} cachedAsset - The file name of the asset with the cache hash.
 * @returns {Array}
 */
ManifestRevisionPlugin.prototype.mapAsset = function (logicalAssetPath, cachedAsset) {
    if (logicalAssetPath.charAt(0) === '/') {
        logicalAssetPath = logicalAssetPath.substr(1);
    }

    return [logicalAssetPath, cachedAsset];
};

/**
 * Take in the modules array from the webpack stats and produce an object that
 * only includes assets that matter to us. The key is the asset logical path
 * and the value is the logical path but with the cached asset name.
 *
 * You would use this as a lookup table in your web server.

 * @param {string} data - Array of webpack modules.
 * @returns {Object}
 */
ManifestRevisionPlugin.prototype.parsedAssets = function (data) {
    var assets = {};

    for (var i = 0, length = data.length; i < length; i++) {
        var item = data[i];
        var addCurrentItem = false;
        var isFile;

        try {
            isFile = fs.lstatSync(item.name).isFile();
        } catch (e) {
            isFile = false;
        }

        if (this.options.extensionsRegex && item.name
            && (typeof item.name === 'string' || item.name instanceof String)
            && item.name.match(this.options.extensionsRegex)) {

            addCurrentItem = true;
        }

        // Attempt to ignore chunked assets and other unimportant assets.
        if (isFile &&
            item.name.indexOf('~/') === -1 &&
            item.reasons.length === 0 &&
            item.hasOwnProperty('assets') &&
            item.assets.length === 1) {

            addCurrentItem = true;
        }

        if (addCurrentItem) {

            var itemName = item.name;
            var rootPath = this.options.rootAssetPath;

            if (path.isAbsolute(rootPath)) {
                itemName = path.resolve(itemName);
            }
            // Convert win path to posix path.
            if (path.sep === '\\') {
                var winRegExp = new RegExp('\\' + path.sep, 'g');
                itemName = itemName.replace(winRegExp, '/');
                rootPath = rootPath.replace(winRegExp, '/');
            }

            var nameWithoutRoot = itemName.replace(rootPath, '');
            var mappedAsset = this.mapAsset(nameWithoutRoot, item.assets[0]);

            assets[mappedAsset[0]] = mappedAsset[1];
        }
    }

    return assets;
};

/**
 * Is this asset safe to be added?

 * @param {string} path - The path being checked.
 * @returns {boolean}
 */
ManifestRevisionPlugin.prototype.isSafeToTrack = function (path) {
    var safeResults = [];

    for (var i = 0, length = this.options.ignorePaths.length; i < length; i++) {
        var ignorePath = this.options.ignorePaths[i];
        var isSafePath =
          ignorePath instanceof RegExp ?
            !ignorePath.test(path) :
            path.indexOf(ignorePath) === -1;
        safeResults.push(isSafePath);
    }

    // Make sure we have no false entries because we need all trues for it to be
    // considered safe.
    return safeResults.indexOf(false) === -1;
};

/**
 * Walk the assets and optionally filter any unwanted sub-paths. This applies
 * the PrefetchPlugin plugin to each asset that's not ignored. This makes it
 * available to webpack.

 * @param {object} compiler - The webpack compiler.
 * @returns {null}
 */
ManifestRevisionPlugin.prototype.walkAndPrefetchAssets = function (compiler) {
    var self = this;

    var walker_options = {
        listeners: {
            file: function (root, fileStat, next) {
                var assetPath = path.resolve(root, fileStat.name);
                if (self.isSafeToTrack(assetPath)) {
                    compiler.apply(new webpack.PrefetchPlugin(assetPath));
                }

                next();
            }
        }
    };

    walk.walkSync(this.options.rootAssetPath, walker_options);
};

ManifestRevisionPlugin.prototype.apply = function (compiler) {
    var self = this;
    var output = this.output;

    // Micro optimize toJson by eliminating all of the data we do not need.
    var options = {};
    options.assets = true;
    options.version = false;
    options.timings = false;
    options.chunks = false;
    options.chunkModules = false;
    options.cached = true;
    options.source = false;
    options.errorDetails = false;
    options.chunkOrigins = false;

    self.walkAndPrefetchAssets(compiler);

    compiler.plugin('done', function (stats) {
        var data = stats.toJson(options);
        var parsedAssets = self.parsedAssets(data.modules);
        var outputData = null;

        if (typeof self.options.format === 'string' ||
            self.options.format instanceof String) {
            var format = new Format(data, parsedAssets);
            outputData = format[self.options.format]();
        }
        else {
            outputData = self.options.format(data, parsedAssets);
        }

        if (typeof outputData === 'object') {
            outputData = JSON.stringify(outputData);
        }

        fs.writeFileSync(output, String(outputData));
    });
};

module.exports = ManifestRevisionPlugin;
