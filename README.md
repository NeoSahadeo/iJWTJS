# i Just Want Templating JS

iJWST.js is simple Javascript utility script
that lets me create simple HTML sites.

There are future plans to add more capabilities
such as loops, blocking, caching and build workflows.
But for now it works.

# Documentation

## Tabes of contents
### Configuration
1. [Site Directive](#site-directive)
2. [Directive List](#directive-list)
### Functions
1. [URL Resolver](#url-resolver)

## Site Directive

A site directive is the directory
after the base of the URL. This functions
in the same way as it does in Sveltekits
production configuration for the static
adapter.

The site_directive should
be known ahead of production launch.

    **Example:**

    https://mysql05.comp.dkit.ie/D00264604/Week3

    site_directive = D00264604/Week3

**default configuration**

```javascript
const site_directive = "";
```

## Directive List

The directive list is a list of directories
that will be searched when a file is requested.

**default configuration**

```javascript
const directive_list = ["", "pages", "partials"];
```

## URL Resolver

Provides a consitent way to generate to
correct urls for resources.

@return {String} url - Base URL Path + site_directive
