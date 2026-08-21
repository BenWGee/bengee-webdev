# Bengee.xyz

This repo hosts my websites. Each folder has something a little different. They are isolated projects with no real connection. However, they are all in the same repo as GitHub only allows one published page.

The sections are outlined below. 

# links

# My Links

A lightweight, data-driven link page. All content and theming is controlled through JSON files — no code changes needed to add links, swap colors, or update page text.

See the full explanation in `links/README.md`. 

TLDR: If you want a link-tree style page, but don't want to write a bunch of new HTML every time you want to add a new link, check this out. 

---

# tnm_links

 A website populated with links based on a json file for the "Tuesday Night Magic" games club. This is an earlier version of what would be seen in the `links` folder.

 ````
[
  {
    "title": "My Repo",
    "type": "link",
    "content": "https://github.com/BenWGee/bengee-webdev/tree/main",
    "icon": "💻"
  },
  {
    "title": "About Me",
    "type": "text",
    "content": "Hi, I am a developer",
    "icon": "🏆"
  },
]
````

# new-trees

This is a simple HTML/CSS website that displays some of my photos. The goal was something like a 'zine' but in a digital format. You're welcome to copy the code, but please credit my images if you reuse them anywhere.

# scipts

This contains the JavaSript that powers a couple of the sites. The links and tnm_links pages were so similar I put the script in a shared location to avoid writing the same code twice. 

# sumo 

This is a wrapper for the sumo api. I like sumo wrestling, and wanted to make a little project around it. The first page is a full api explorer. The second page shows a spoiler-free view of the fights for a given day. 
