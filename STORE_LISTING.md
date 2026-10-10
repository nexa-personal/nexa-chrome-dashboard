# NEXA — Chrome Web Store Listing

## Short description
A customizable new-tab dashboard: clock, world clock, weather, markets, tasks, bookmarks and RSS.

## Full description
NEXA transforms the Chrome New Tab into a customizable personal dashboard.

Features:
- Digital 24-hour clock and Persian date
- World clock widget — add any city/time zone
- Shamsi (Persian) calendar by default, one click to switch to Gregorian
- Network widget: public IP and live ping
- Photo frame (slideshow) with adjustable timing
- Remove any widget and restore it any time from Settings → Widget management
- Blur button to hide your quick notes
- 8-day weather forecast with air quality (AQI)
- Google or DuckDuckGo search
- Drag-and-drop widget layout and free resizing of every widget
- Show/hide any widget
- Quick task list with progress tracking
- Calculator (mouse + keyboard)
- Open-Meteo weather, UV and air quality, with city search
- Cryptocurrency prices in USD (CoinGecko)
- Forex pairs (ECB reference rates via Frankfurter)
- Iranian market prices: USD, EUR, gold, coins (TGJU)
- Custom bookmarks with site favicons
- RSS news feeds
- Custom wallpaper and built-in backgrounds
- All settings stored locally

NEXA does not sell user data. RSS host access is requested only when the user adds an RSS feed. Location is used only when the user explicitly requests location-based weather.

## Permission justifications (for review)
- storage / unlimitedStorage: saves dashboard settings and the user's own photo-frame pictures locally (nothing is uploaded).
- geolocation: only when the user presses the "my location" button in the weather widget.
- Host permissions (api.open-meteo.com, air-quality-api.open-meteo.com, geocoding-api.open-meteo.com): weather, air quality and city search.
- ipwho.is / api.ipify.org: show the user's public IP in the Network widget.
- api.coingecko.com: cryptocurrency prices.
- api.frankfurter.dev / api.frankfurter.app: forex reference rates.
- *.tgju.org: Iranian market prices (USD, EUR, gold).
- news.google.com: default news feed.
- Optional host permissions (https://*/*, http://*/*): requested at runtime, one domain at a time, only when the user adds their own RSS feed.
