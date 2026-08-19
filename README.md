# Bengee.xyz

This repo hosts my websites. Each folder has something a little different. They are isolated projects with no real connection. However, they are all in the same repo as GitHub only allows one published page.

The sections are outlined below. 

 # links and tnm_links

 Both folders follow the same idea. They are a "Link Tree" style website. One is for my personal projects, the other is for a Magic the Gathering club I run. 

 The HTML is populated dynamically using content saved in a json file. Here's a snippet below for the format.

 ````
[
  {
    "title": "My Repo",
    "type": "link",
    "url": "https://github.com/BenWGee/bengee-webdev/tree/main",
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

You can copy all the relevant code, then drop in your own json for a personal link site. The text "type" also allows you to publish text instead of links.
