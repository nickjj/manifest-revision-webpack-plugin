var assert = require('assert');

var Format = require('../format');
var rawStats = require('./fixtures/rawStats');
var parsedAssets = require('./fixtures/parsedAssets');

var format = new Format(rawStats, parsedAssets);

function test_general() {
    var data = format.general();

    assert.equal(data.publicPath, 'http://localhost:2992/assets/');

    assert.equal(data.assets['app_js.js'],
                 'app_js.5018c3226e10bf313701.js');
    assert.equal(data.assets['hot_app_js.js'],
                 'app_js.5018c3226e10bf313701.js');
    assert.equal(data.assets['app_css.js'],
                 'app_css.291431bdd7415f9ff51d.js');
    assert.equal(data.assets['app_css.css'],
                 'app_css.291431bdd7415f9ff51d.css');
    assert.equal(data.assets['images/spinner.gif'],
                 'images/spinner.37348967baeae34bfa408c1f16794db1.gif')
    assert.notEqual(data.assets['images/credit-cards/visa.png'],
                    'visa.26bcf191ee12e711aa540ba8d0c901b7.png')
}

function test_rails() {
    var data = format.rails();

    assert(data.assets);
    assert(data.files);

    assert.equal(data.files['images/spinner.37348967baeae34bfa408c1f16794db1.gif']['logical_path'],
                 'images/spinner.gif')
    assert.notEqual(data.files['images/spinner.37348967baeae34bfa408c1f16794db1.gif']['logical_path'],
                 'images/spinner.37348967baeae34bfa408c1f16794db1.gif')
}

test_general();
test_rails();
