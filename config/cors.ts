import { defineConfig } from '@adonisjs/cors'

const corsConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Enabled
  |--------------------------------------------------------------------------
  |
  | A boolean value to enable or disable CORS altogether.
  |
  */
  enabled: true,

  /*
  |--------------------------------------------------------------------------
  | Origin
  |--------------------------------------------------------------------------
  |
  | Define the origins for which you want to enable CORS. You can define
  | them as a function that receives the current origin and returns a
  | boolean.
  |
  | Wildcard "*" will allow all origins. However, when credentials are enabled,
  | wildcard cannot be used.
  |
  */
  origin: true,

  /*
  |--------------------------------------------------------------------------
  | Methods
  |--------------------------------------------------------------------------
  |
  | An array of HTTP methods for which CORS must be enabled.
  |
  */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],

  /*
  |--------------------------------------------------------------------------
  | Headers
  |--------------------------------------------------------------------------
  |
  | List of headers to be allowed for CORS requests. The value can be a
  | boolean, a string, an array of strings, or a function that returns
  | any of these values.
  |
  */
  headers: true,

  /*
  |--------------------------------------------------------------------------
  | Expose Headers
  |--------------------------------------------------------------------------
  |
  | A list of headers to be exposed to the client. The value can be a
  | boolean, a string, an array of strings, or a function that returns
  | any of these values.
  |
  */
  exposeHeaders: [
    'cache-control',
    'content-language',
    'content-type',
    'expires',
    'last-modified',
    'pragma',
  ],

  /*
  |--------------------------------------------------------------------------
  | Credentials
  |--------------------------------------------------------------------------
  |
  | Define whether or not to include credentials in CORS response. This
  | is needed when you want to include cookies or authorization headers
  | in cross-origin requests.
  |
  */
  credentials: true,

  /*
  |--------------------------------------------------------------------------
  | MaxAge
  |--------------------------------------------------------------------------
  |
  | Define how long the results of a preflight request can be cached.
  |
  */
  maxAge: 90,
})

export default corsConfig
