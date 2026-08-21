# My Links

A lightweight, data-driven link page. All content and theming is controlled through JSON files — no code changes needed to add links, swap colors, or update page text.

---

## File Structure

This project contains other webdev projects I am working on. For the links project you only need to worry about the following:

```
link/
├── links.html                    # Page shell — no content lives here
├── README.md                     # This file
├── links/
|────── link_config
│       ├── link_lookup.json          # Registry of all page configurations
│       ├── educational_links.json    # Link data for the education page
│       └── entertainment_links.json  # Link data for the entertainment page
├── scripts/
|────── link_scripts/
│       └── populate-links.js         # All runtime logic
└── styles/
|────── link_style/
        └── main.css                  # Layout and component styles
```

Any other folder/file is for different projects I am working on. 

I am usign various sub-folders to keep different sections of my website seperate. For example, there is a `styles/link_style` and `styles/sumo_style` folder. Each holds a different `main.css` file This allows me to better manage my entire site, by keeping the link and sumo sections clearly divided. 

You are welcome to simplify the file strucutre if you do not intend to have multiple projects on the one website, or simply ignore them.

```
└── styles/
|────── link_style/
        └── main.css                  # Layout and component styles
|────── sumo_style/ 
        └── main.css                  # Layout and component styles
```

---

## How it works

The site is a single HTML page (`links.html`) that loads content at runtime from JSON files in the `links/links_config` folder. There are no databases or build steps — just open the file in a browser (via a local web server) and it works.

### Loading sequence

1. `links.html` loads `styles/link_style/main.css` for layout and structure.
2. `scripts/link_scripts/populate-links.js` runs and reads the `?type=` parameter from the URL (e.g. `?type=education`).
3. It fetches `links/link_config/link_lookup.json` to find the matching entry.
4. From that entry it:
   - Generates and injects a color theme as a `<style>` block in the page head.
   - Sets the page title, subtitle, and footer text.
   - Fetches the appropriate link data file (e.g. `links/link_config/educational_links.json`).
   - Renders each link as a card on the page.

### URL parameter

| URL | Result |
|-----|--------|
| `links.html` | Loads the first entry in `link_lookup.json` |
| `links.html?type=education` | Loads the `education` entry |
| `links.html?type=entertainment` | Loads the `entertainment` entry |

---

## Non-developer guide: customising the site through JSON

You do not need to touch any HTML, CSS, or JavaScript to change the site's content, colors, or text. Everything is controlled through the files in the `links/link_config` folder.

### link_lookup.json — page configuration

This file is the main control panel. Each entry in the list represents one version of the page, selectable via the URL.

```json
[
    {
        "name": "personal",
        "file": "personal_links.json",
        "theme": "orange dark",
        "page_title": "Bengee.xyz  Personal Links",
        "page_subtitle": "Here's some stuff I like, have a look.",
        "page_footer": "Check out my Github to make your own!"
    },
    {
        "name": "education",
        "file": "educational_links.json",
        "theme": "indigo light",
        "page_title": "Educational Links",
        "page_subtitle": "A curated collection of learning resources",
        "page_footer": "These are some great resources!"
    },
]
```

#### Field reference

| Field | What it does | Example |
|-------|-------------|---------|
| `name` | The URL parameter that loads this page | `"education"` → `?type=education` |
| `file` | The JSON file containing the links to display | `"educational_links.json"` |
| `theme` | Color theme: a color name followed by `dark` or `light` | `"indigo light"`, `"red dark"` |
| `page_title` | Large heading shown at the top of the page | `"My Links"` |
| `page_subtitle` | Smaller italic text below the heading | `"Updated weekly"` |
| `page_footer` | Small text shown at the bottom of the page | `"Contact me at..."` |

> **Tip:** Set `page_title`, `page_subtitle`, or `page_footer` to `""` (empty quotes) to hide that section entirely.

#### Available theme colors

Use any of these color names followed by `dark` or `light`:

`red` · `orange` · `amber` · `yellow` · `lime` · `green` · `teal` · `cyan` · `sky` · `blue` · `indigo` · `violet` · `purple` · `pink` · `rose`

**Examples:** `"blue dark"`, `"orange light"`, `"rose dark"`, `"teal light"`

---

### Link data files (e.g. educational_links.json)

Each file contains a list of cards to display on the page. There are two types of card.

#### Type 1 — Link card (opens a website)

```json
{
    "title": "Wikipedia",
    "content": "https://www.wikipedia.org",
    "type": "url",
    "icon": "📖"
}
```

| Field | What it does |
|-------|-------------|
| `title` | The text shown on the card |
| `content` | The full URL the card links to (must start with `https://`) |
| `type` | Must be `"url"` for a link card |
| `icon` | An emoji     shown to the left of the title |

#### Type 2 — Text card (expandable information)

```json
{
    "title": "About this page",
    "content": "This page contains a curated list of links.",
    "type": "text",
    "icon": "ℹ️"
}
```

| Field | What it does |
|-------|-------------|
| `title` | The text shown on the card (always visible) |
| `content` | The text revealed when the card is clicked |
| `type` | Must be `"text"` for an expandable card |
| `icon` | An emoji shown to the left of the title |

#### Adding a new link

1. Open the relevant JSON file (e.g. `educational_links.json`).
2. Copy an existing entry.
3. Paste it inside the `[...]` list, making sure each entry is separated by a comma.
4. Update the `title`, `content`, and `icon` fields.
5. Save the file.

#### Adding a new page entirely

1. Create a new link data file in `links/` (e.g. `my_links.json`) following the format above.
2. Add a new entry to `link_lookup.json` pointing to that file.
3. Access it at `links.html?type=<name>`.

---

## Running locally

The page uses `fetch()` to load JSON files, which requires a web server — opening `links.html` directly as a file will not work. The simplest option is the VS Code "Open in Integrated Browser" option. 

## Running with Github Pages

This site is currently live using Github Pages. You can follow [this guide](https://docs.github.com/en/pages/quickstart) to set up your own repository, and Github Page.

Your page will be available at: `your_username.github.io` by default. 

If you have your own domain name, Github pages allows you to assign that domain to the page. In my case, [bengee.xyz](https://bengee.xyz) will bring you to this `README.md` file in your browser. [bengee.xyz](https://bengee.xyz)

For this project, the `links.html` page is inside the `links` folder. So I have to go to https://bengee.xyz/links/links.html to load the page.

The first entry of `link_lookup.json` will be loaded by default. To specify a page, add `?type=some_value` to the url. For example `?type=personal` will load the `personal_links.json`.