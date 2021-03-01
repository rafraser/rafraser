---
title: Horizon - Scrapers
subtext: Scraping Steam game ownership info
tags:
  - Python
  - RegEx
  - Webscraping
  - Horizon
prism:
  - python
thumbnail: downarrow
repository:
  url: https://github.com/rafraser/horizon/blob/main/util/steam_games_scraper.py
  display: horizon
date: February 28, 2021
---

As part of Horizon, I wanted to build a feature that helps you find what multiplayer games you & your friends have in common.

Some people have a lot of games, so it'd be great to automate this functionality out & keep it up to date.
Luckily, the Steam games profile page is pretty easy to scrape.

I've written a fair few scrapers in my time - if you're interested in hearing some more complicated situations, let me know!

First step of building scraper: we need to examine the webpage in-depth to find any weaknesses.
If a webpage is displaying data - that data has to come from somewhere! If we're lucky, we can find an easy way to pull out the data directly instead of fully parsing the page.
Chrome DevTools are extremely helpful for this! (Firefox is probably just as useful)

Most modern websites load the basic "structure" of the page first, then send an extra request to the server to fetch the data.
If a site is doing this, it's usually pretty easy to scrape - we can copy that request in our scraper, and get that data in a nice machine-readable format without having to dig through the page for it. In the _Network_ tab of Chrome DevTools, we can keep an eye out for these requests in the XHR group.

![Network requests from a Steam games page](../../assets/img/2021/02/steam-games-network.png)

Unfortunately, the Steam games page isn't doing this. This means that the games list is either being rendered server-side, or stored somewhere else. Let's take a look at the page source to see what's happening:

![Examining the page](../../assets/img/2021/02/steam-games-examining.png)

Each game on the page has a gameListRowItem div. One approach to getting this data would be to iterate through these divs, and grab the data we need from them. It's possible to do better though - let's keep looking at the source.

![Finding the shortcut](../../assets/img/2021/02/steam-games-javascript.png)

In the Javascript code for the page, the full list of games is stored. With a little bit of regex trickery, we can pull this data out easily instead of having to iterate through the actual HTML tags.

```python
re.compile("var rgGames = (\[.*\])")
```

I won't go too much into RegEx here (there are entire books on it, if you really like reading) - but this is a relatively simple expression. Let's break it down:

- `var rgGames =` we're trying to match this part of the string directly. This helps us find the variable we want from the script tag.
- `\[` and `\]` mean "match the [ and ]" characters. We put the backslashes in front of them so we know to literally match these, and not treat them as a RegEx operator.
- `.*` means to match any character any number of times - essentially get everything between the [] indiscriminately
- `(` round brackets `)` mark a _capturing group_. In this case, we only care about the data in the brackets and not the variable name.

We can then apply this on a crawled page to get the data we want, in JSON format. Yay! Here's a quick example using the requests library - in the real world, you'll want a lot more error handling:

```python
import requests

def get_games_url(steamid: str) -> str:
    return f"https://steamcommunity.com/profiles/{steamid}/games/?tab=all"

# Grab the page content for a given steam ID
url = get_games_url(steamid)
page_content = requests.get(url).text

pattern = re.compile("var rgGames = (\[.*\])")
result = pattern.search(content)
if result:
    # We only want the bit in the first capturing group
    json_response = result.group(1)

    # Parse the JSON string into a Python dictionary
    games_response = json.loads(json_response)

    # In this case, we're only interested in the app IDs
    return [str(game.get("appid")) for game in games_response]
```
