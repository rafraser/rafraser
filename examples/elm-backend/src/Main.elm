port module Main exposing (main)

import Platform exposing (worker)
import Time


{-| A basic port that sends an integer to JS
This connects to a function in our Javascript runtime
-}
port log : Int -> Cmd msg


{-| This bit is the key part to getting this program working in the backend

We take in a "String" flag when we initialise
We need an initial state, an update function, and the subscriptions that make it tick

-}
main : Program String Model Msg
main =
    worker
        { init = init
        , update = update
        , subscriptions = subscriptions
        }


{-| In our model, we need to keep track of our counter and a secret key
We take the secret key in from the JS flags
-}
type alias Model =
    { counter : Int
    , secretKey : String
    }


{-| In this example, we only have one action: increment the counter
We need the Time.Posix parameter to link in with the Time subscriptions later
-}
type Msg
    = Increment Time.Posix


{-| When initialising the model, set the count to 0 and take in our secretKey from JS
-}
init : String -> ( Model, Cmd Msg )
init secretKey =
    ( { counter = 0
      , secretKey = secretKey
      }
    , Cmd.none
    )


{-| Super simple update function
When we increment, send the last count value out to JS
-}
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment _ ->
            ( { model | counter = model.counter + 1 }
            , log model.counter
            )


{-| Add a subscription to increment the counter once every second
-}
subscriptions : Model -> Sub Msg
subscriptions _ =
    Time.every 1000 Increment
