## Manifest revision plugin for webpack

Wouldn't it be nice if you could output a json file that looked like this?

```json
{
  "publicPath": "http://localhost:2992/assets/",
  "assetsByChunkName": {
    "app_js": "app_js.b359b8f956c6cfd0c7f2.js",
    "app_css": [
      "app_css.9b34bf5794798118d77c.js",
      "app_css.9b34bf5794798118d77c.css"
    ],
    "common": "common.43ba800be83617a071ca.js"
  },
  "assets": {
    "images/hamburger.svg": "images/hamburger.d2cb0dda3e8313b990e8dcf5e25d2d0f.svg",
    "images/touch/320x600__light-aqua.png": "images/touch/320x600__light-aqua.f0d51db7c4aa72532cf26fe10a616a0f.png",
    "images/touch/apple-touch-icon.png": "images/touch/apple-touch-icon.7326f54bfe6776293f08b34c3a5fde7b.png",
    "images/touch/chrome-touch-icon-192x192.png": "images/touch/chrome-touch-icon-192x192.571f134f59f14a6d298ddd66c015b293.png",
    "images/touch/icon-128x128.png": "images/touch/icon-128x128.7c46d686765c49b813ac5eb34fabf712.png",
    "images/touch/ms-touch-icon-144x144-precomposed.png": "images/touch/ms-touch-icon-144x144-precomposed.452d90b250d6f41a0c8f9db729113ffd.png"
  }
}
```

Well, now you can. Here's what it includes:

- Assets include their logical paths for easy lookups on your server
- You only have to keep track of your asset server in 1 place (your webpack config)
- It's as small as possible and provides just enough info to do what it's intended to do

## Installation

`npm install --save manifest-revision-webpack-plugin`


## Quick start

```js
var ManifestRevisionPlugin = require('manifest-revision-webpack-plugin');

// This is where we want the manifest.json file to be created.
var manifestPath = path.join('build', 'manifest.json');

// Where are your assets located in your project? This would typically be a path
// that contains folders such as: images, stylesheets and javascript.
var rootAssetPath = './src/client';

plugins = [
  // Insert all of your plugins here...

  new ManifestPlugin(manifestPath), {
      rootAssetPath: rootAssetPath
  })
];


/**
 *------------------------------------------------------------------------------
 * In order to get webpack to recognize our individual assets we need to tell
 * it where to look. I would really like to incorporate this into the plugin
 * itself but I don't know how yet.
 *------------------------------------------------------------------------------
 */
var walk = require('walk');
var walker_options;

walker_options = {
  listeners: {
      file: function (root, fileStat, next) {
          // We want to ignore the /stylesheets and /javascript dirs.
          // You will probably want to modify this for your own setup.
          if (root.indexOf('/stylesheets') === -1 && root.indexOf('/javascript') === -1) {
              plugins.push(new webpack.PrefetchPlugin('./' + path.join(root, fileStat.name)));
          }

          next();
      }
  }
};
walk.walkSync(rootAssetPath, walker_options);
// -----------------------------------------------------------------------------

module.exports = {
  plugins: plugins
};
```

## API

`rootAssetPath` defines where it should start looking for assets.

## How would I use the manifest file?

It can be used with any server and any programming language. What you could do
is read the `manifest.json` file in once when your app boots up. Then create a
template helper that accepts an asset and behind the scenes it will lookup
that asset and return back the real file name.

### What would that look like on the server?

Ok, let's say you're using the jinja template engine. You've also created a
helper called `asset_for`.

##### Call your template helper in a template:
```jinja
<img src="{{ asset_for('images/hamburger.svg') }}" alt="Hamburger">
```

##### It will produce this source code:
```jinja
<img src="images/hamburger.d2cb0dda3e8313b990e8dcf5e25d2d0f.svg" alt="Hamburger">
```

### What would the implementation of that look like?

There's too many web frameworks to include examples. As people use the project
it would be nice to create wiki pages that have end to end examples on how to
implement it in popular web frameworks.

## Contributors

- Nick Janetakis <<nick.janetakis@gmail.com>>