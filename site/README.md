# Static Site Generator

## Usage

### Building the Generator

```bash
npm run build
```

### Building the Static Sites

Ensure that the static site generator itself is built first.

When the static site generator is fired, it will work with the **static-content** folder. Inside the following, I'm using the following folders:

- assets  
  Any static assets, such as images

- pages  
  The actual meat of the website - pages that need to be built

- sass  
  Sass styles which will be compiled into .css stylesheets

- templates  
  Layout templates

To build everything:

```bash
npm run static-build
```

To cleanup existing files before building:

```bash
npm run static-all
```

## Why not use Jekyll/Hugo/etc?

I don't have the greatest of reasons for this. I thought it'd be a decent little project to get familiar with liquid templating, among other things. I also wanted to experiment with the idea of being able to fire webhooks when a new page was published.
