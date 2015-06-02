## Manifest revision plugin for webpack

Wouldn't it be neat if you could just supply a directory path, install a plugin
and now magically all of the assets found were automatically auto-tagged with
their md5 value so you can cache them forever?

That's what this plugin does. For example, here's a manifest file that it output:

```json
{
  "publicPath": "http:\/\/localhost:2992\/assets\/",
  "assets": {
    "images\/hamburger.svg": "images\/hamburger.d2cb0dda3e8313b990e8dcf5e25d2d0f.svg",
    "images\/spinner.gif": "images\/spinner.37348967baeae34bfa408c1f16794db1.gif",
    "images\/touch\/apple-touch-icon.png": "images\/touch\/apple-touch-icon.7326f54bfe6776293f08b34c3a5fde7b.png",
    "images\/touch\/chrome-touch-icon-192x192.png": "images\/touch\/chrome-touch-icon-192x192.571f134f59f14a6d298ddd66c015b293.png",
    "images\/touch\/icon-128x128.png": "images\/touch\/icon-128x128.7c46d686765c49b813ac5eb34fabf712.png",
    "images\/touch\/ms-touch-icon-144x144-precomposed.png": "images\/touch\/ms-touch-icon-144x144-precomposed.452d90b250d6f41a0c8f9db729113ffd.png",
    "images\/credit-cards\/american-express.png": "images\/credit-cards\/american-express.8a5ade08365dcc7e5fa39a946bb76ab8.png",
    "images\/credit-cards\/diners-club.png": "images\/credit-cards\/diners-club.03afaaa2d75264e332dc28309b7410b9.png",
    "images\/credit-cards\/discover.png": "images\/credit-cards\/discover.f89468f36ba1a9080b3bb05b9587d470.png",
    "images\/credit-cards\/jcb.png": "images\/credit-cards\/jcb.58f43e5f1fb8c6a4e7e76a17e7824e29.png",
    "images\/credit-cards\/mastercard.png": "images\/credit-cards\/mastercard.373e4f1ac72b50605183e8216edde845.png",
    "images\/credit-cards\/visa.png": "images\/credit-cards\/visa.26bcf191ee12e711aa540ba8d0c901b7.png",
    "app_js.js": "app_js.5018c3226e10bf313701.js",
    "app_css.css": "app_css.291431bdd7415f9ff51d.css"
  }
}
```

#### Custom output formats

What if you could easily format the output of the above file so it worked with
existing frameworks such as Ruby on Rails? Sure, no problem buddy.


#### Here's what's included

- Assets include their logical paths for easy lookups on your server
- You only have to keep track of your asset server in 1 place (your webpack config)
- It's as small as possible and provides just enough info to do what it's intended to do
- Supports multiple output formats

## Installation

`npm install --save manifest-revision-webpack-plugin`


## Quick start

```js
var ManifestRevisionPlugin = require('manifest-revision-webpack-plugin');

// Where are your assets located in your project? This would typically be a path
// that contains folders such as: images, stylesheets and javascript.
var rootAssetPath = './src/client';

module.exports = {
  module: {
    loaders: [
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
            'file?context=' + rootAssetPath + '&name=[path][name].[hash].[ext]'
        ]
      }
    ]
  },
  plugins: [
    new ManifestRevisionPlugin(path.join('build', 'manifest.json'), {
        rootAssetPath: rootAssetPath,
        ignorePaths: ['/stylesheets', '/javascript']
    })
  ]
};
```

## API

- `rootAssetPath` defines where it should start looking for assets.
- `ignorePaths` is an array of paths to ignore.
- `format` allows you to pick the manifest output file format.
  - Currently supports `general` (default) and `rails`.
  - Want to create your own format? Submit a pull request.

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