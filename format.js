/**
* Format raw webpack stats in a way that suites you.
* @param {object} data - The raw stats returned by webpack.
* @param {object} parsedAssets - List of assets that have already been parsed.
* @returns {object}
*/
var Format = function (data, parsedAssets) {
    this.data = data;
    this.assets = parsedAssets;
};

/**
 * CSS assets will get a Javascript chunk output with it, this function removes
 * that and leaves you with just a single chunk.

 * @returns {object}
 */
Format.prototype.normalizeChunks = function () {
    var output = {};

    for (var chunk in this.data.assetsByChunkName) {
        var chunkValue = this.data.assetsByChunkName[chunk];

        if (typeof chunkValue === 'string') {
            output[chunk] = [chunkValue];
        }
        else {
            chunkValue = chunkValue.filter(function(item) {
                return item.indexOf('hot-update.js') === -1;
            });
            output[chunk] = chunkValue;
        }
    }

    return output;
};

/**
 * At the end of the day the chunks are assets so combine them into the assets.

 * @returns {object}
 */
Format.prototype.mergeChunksIntoAssets = function () {
    var output = {};
    var assetsByChunkName = this.normalizeChunks();

    output.assets = this.assets;

    for (var chunk in assetsByChunkName) {
        for (var asset in assetsByChunkName[chunk]) {
            asset = assetsByChunkName[chunk][asset];
            var fileExtension = asset.split('.').slice(-1)[0];
            var chunkWithExtension = chunk + '.' + fileExtension;

            output.assets[chunkWithExtension] = asset;
        }
    }

    return output;
};

/**
* Return the data back formatted in a general way.
* @returns {object}
*/
Format.prototype.general = function () {
    var output = this.mergeChunksIntoAssets();
    output.publicPath = this.data.publicPath;

    return output;
};

/**
* Return the data back formatted to work with Ruby on Rails.
* @returns {object}
*/
Format.prototype.rails = function () {
    var output = this.general();
    output.files = {};

    for (var asset in this.assets) {
        output.files[this.assets[asset]] = {
            'logical_path': asset
        };
    }

    return output;
};

module.exports = Format;
