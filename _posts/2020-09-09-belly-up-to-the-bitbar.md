---
permalink: /blog/2020/09/belly-up-to-the-bitbar/
title: "Belly up to the Bitbar"
last_modified_at: 2020-09-09T22:13:01-05:00
classes: wide
categories:
  - Blog
tags:
  - technology
  - programming
  - geek
  - open source
  - os x
header:
  image: /assets/images/blog/bitbar.jpg
---

I have cultivated a decent list of programmers and techies to follow. A week or so ago, one of them retweeted this:

<blockquote class="twitter-tweet">
    <p lang="en" dir="ltr">Whoa, BitBar is pretty cool. <a href="https://t.co/DrPffChBRI">https://t.co/DrPffChBRI</a> <a href="https://t.co/keKEUvMimN">pic.twitter.com/keKEUvMimN</a></p>
    &mdash; Michael Moussa (@michaelmoussa) <a href="https://twitter.com/michaelmoussa/status/1296462475278397440?ref_src=twsrc%5Etfw">August 20, 2020</a>
</blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> 

Gave [BitBar](https://github.com/matryer/bitbar) a look and agreed. It is an elegant but simple tool allowing you to use
a variety of programming languages to do tasks from your menu bar. However, there were no existing plugins leaping out
as the "must have" to get me to install it. That quickly changed when something flashed in my mind. I have a shell alias
that opens the Zoom URL associated with a meeting without having to go into my calendar app. It uses
[iCalBuddy](https://hasseg.org/icalBuddy/) to pull the data for a meeting occurring at the present time. While functional,
I always felt there had to be a better way. What if I could just click something to open the Zoom _and_ be have a list
of all meetings occurring today? Hmm... BitBar seems like it could help me do just that.

A couple of nights reading documentation and tinkering resulted in my first pull request for the plugins repository --
[Zooms Today](https://github.com/matryer/bitbar-plugins/pull/1486). The plugin uses iCalBuddy to pull out your upcoming
meetings that contain Zoom links and displays them in a list. Selecting an item in the list will take you to that Zoom
meeting.

![image-center](/assets/images/blog/zooms-today.png){: .align-center}

The plugin refreshes itself every hour showing you only meetings that are happening at that time or for the remainder
of day until no meetings remain.

![image-center](/assets/images/blog/no-zooms-today.png){: .align-center}

I have no other plugins in mind currently, but this was such an easy tool to use. I'm sure to belly up to the BitBar
again and find something else to increase my productivity.
