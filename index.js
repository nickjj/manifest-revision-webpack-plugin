var fs = require('fs');
var path = require('path');

var webpack = require('webpack');
var walk = require('walk');

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
    var logicalPath = logicalAssetPath.substring(0,
        logicalAssetPath.lastIndexOf('/'));

    return [logicalAssetPath, path.join(logicalPath, cachedAsset)];
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

        // Attempt to ignore chunked assets and other unimportant assets.
        if (item.name.indexOf('multi ') === -1 &&
            item.name.indexOf('~/') === -1 &&
            item.reasons.length == 0 &&
            fs.lstatSync(item.name).isFile() &&
            item.hasOwnProperty('assets') &&
            item.assets.length == 1) {

            var nameWithoutRoot = item.name.replace(this.options.rootAssetPath,
                                                    '');
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
        if (path.indexOf(this.options.ignorePaths[i]) === -1) {
            safeResults.push(true);
        } else {
            safeResults.push(false);
        }
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
                if (self.isSafeToTrack(root)) {
                    var assetPath = './' + path.join(root, fileStat.name);
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
        var importantStats = {};
        var data = stats.toJson(options);

        importantStats.publicPath = data.publicPath;
        importantStats.assetsByChunkName = data.assetsByChunkName;
        importantStats.assets = self.parsedAssets(data.modules);

        fs.writeFileSync(output, JSON.stringify(importantStats));
    });
};

module.exports = ManifestRevisionPlugin;
