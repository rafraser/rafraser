---
title: Discord.Elm - Part One
subtext: Running Elm in the Backend
tags:
  - Elm
prism:
  - elm
  - javascript
thumbnail: elm
date: March 5, 2021
---

Elm is a functional programming language, designed for reliable front-end reliable web applications. I've decided on the perfect project for such a language: creating a Discord bot.

## Getting Started

The first hurdle in this process is running an Elm application as the backend, rather than as a frontend webpage. If you were really dedicated, you could probably make a Discord bot as a webpage and just leave it open 24/7, but there's definitely more than a few issues with that approach.

Instead, we should figure out how to get Elm running in a headless JS environment, such as [Node](https://nodejs.org/en/) or [Deno](https://deno.land/).

- We can manage it as we would any other terminal application
- We can link in with Node/Deno/etc. functionality if we really need it
- It's probably a lot safer not to put your Discord API key in a webpage

## Elm Programs

Most Elm programmers are probably used to using the [Browser](https://package.elm-lang.org/packages/elm/browser/latest/Browser) library to start applications. There are a few neat setups here, but they all require a view function - which isn't what we're after.

If we rummage through the elm/core documentation, we can find some neat functionality in the [Platform](https://package.elm-lang.org/packages/elm/core/latest/Platform) library - specifically the worker function. This takes in an init function, an update function, and a list of subscriptions - this is perfect for what we need!

Let's start off by making a simple counter example. If you're brand new to Elm, - there's a [fantastic introductory guide](https://guide.elm-lang.org/). This example is very similar to the [Button](https://guide.elm-lang.org/architecture/buttons.html) and [Time](https://guide.elm-lang.org/effects/time.html) pages.

```elm
module Main exposing (main)

import Platform exposing (worker)
import Time


{-| This bit is the key part to getting this program working in the backend
We need an initial state, an update function, and the subscriptions that make it tick
-}
main : Program () Model Msg
main =
    worker
        { init = init
        , update = update
        , subscriptions = subscriptions
        }


{-| We need to keep track of our current count in the Model

Strictly speaking, we don't need a record type for only one variable here
But since we'll be growing this later in the series, let's start things off like this
-}
type alias Model =
    { counter : Int
    }


{-| In this example, we only have one action: increment the counter
We need the Time.Posix parameter to link in with the Time subscriptions later
-}
type Msg
    = Increment Time.Posix


{-| Initialise the model with a count of 0
We don't need to run any commands to set things up
-}
init : () -> ( Model, Cmd Msg )
init _ =
    ( { counter = 0 }, Cmd.none )


{-| Super simple update function

When we get an Increment message, add one to our internal counter
-}
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment _ ->
            ( { model | counter = model.counter + 1 }
            , Cmd.none
            )


{-| Add a subscription to increment the counter once every second
-}
subscriptions : Model -> Sub Msg
subscriptions model =
    Time.every 1000 Increment
```

## Javascript Runtime

Once we have an Elm program, we need to compile it to a .js file:

```bash
elm make src/Main.elm --output=elm.js
```

Now that we have this .js file, we can work with it in a similar way to other Javascript modules. We just need some sort of process that's able to actually execute the Javascript for us - [Node](https://nodejs.org/en/) or [Deno](https://deno.land/) are great choices here.

```javascript
// Node
const { Elm } = require("./elm.js");

// Deno
import { Elm } from "./elm.js";

const app = Elm.Main.init();
```

That's all we need! We can now run this Javascript file in Node or Deno (or another Javascript runtime) and our Elm program will be executed for us!

If you're feeling particularly ambitious (and are 100% sure you want to work exclusively in Elm land):

```bash
node -e "require('./dist/elm.js').Elm.Main.init()"
```

## Communication

If you've been following along, you'll probably have noticed that not much seems to be happening when we run our code. Our Elm program is running, but since we have no logging or anything like that it's difficult to tell what's going on.

### Debug.log

If we don't want to bother setting up anything fancy in Javascript, but we'd still like some console logging to make sure things are running smoothly, we can stick some Debug.log statements in our code and they'll work perfectly fine.

```elm
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment _ ->
            let
                _ =
                    Debug.log "Count" model.counter
            in
            ( { model | counter = model.counter + 1 }
            , log (String.fromInt model.counter)
            )
```

There are a few drawbacks to this:

- We can't compile our Elm code with --optimize if we use debug statements
- This doesn't help us if we want to save logs to a file, or implement some other Javascript interoperability
- The syntax can be a bit unwieldy

### Ports

[Ports](https://guide.elm-lang.org/interop/ports.html) are an essential part of allowing Elm and Javascript to work together. In the browser land, they're useful for things like WebSockets and localStorage. In our world, they're our key to working with Node/Deno functionality from within Elm.

We don't need anything special to implement ports in our Node/Deno environment - creating ports as usual works fine.

```elm
{-| This is a port that sends a Int to Javascript
-}
port log : Int -> Cmd msg
```

Don't forget to mark the module as a port module!

```elm
port module Main exposing (main)
```

Now, instead of doing nothing (Cmd.none) in our update function, we want to trigger the port command:

```elm
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment _ ->
            ( { model | counter = model.counter + 1 }
            , log model.counter
            )
```

In our index.js file, we can then add a handler for this port:

```javascript
const app = Elm.Main.init();
app.ports.log.subscribe(console.log);
```

We're all wired up now! We have connections from Elm land to our Javascript runtime, and we can easily extend our logging functionality to do anything that Node/Deno can.

### Flags

[Flags](https://guide.elm-lang.org/interop/flags.html) are a way to pass values into Elm on initialization. This is great for loading cached information, or passing through API keys.

Once again, there's not actually anything special about Flags when we're not running in a browser - the process is exactly the same. Let's take a quick look at how to do it anyway:

```javascript
const secretKey = "helloworld";
const app = Elm.Main.init({
  flags: secretKey,
});
```

In this case, we're passing a String value into our Elm initialization function. We do need to slightly rework our Elm code to handle this.

```elm
{-| We've updated our type signature to specify the type of flags we're taking in
Instead of () [nothing] we're now taking in a String [our secret key]
-}
main : Program String Model Msg
main =
    worker
        { init = init
        , update = update
        , subscriptions = subscriptions
        }

{-| We've updated our model to also keep track of an additional secret key
We're not actually doing anything with it here, but let's pretend it's important
-}
type alias Model =
    { counter : Int
    , secretKey : String
    }

{-| We're passed through a string flag - let's store this in our model
-}
init : String -> ( Model, Cmd Msg )
init secretKey =
    ( { counter = 0
      , secretKey = secretKey
      }
    , Cmd.none
    )
```

## Conclusion

This article has hopefully helped you learn everything you need to know to running Elm outside of the browser! You can find the completed example code on my Github [here](https://github.com/rafraser/rafraser/tree/master/examples/elm-backend/).

Next up, we'll talk about how the Discord API works and how we're going to approach tackling it in Elm.

Part Two: coming soon.
