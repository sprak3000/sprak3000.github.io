---
permalink: /blog/2007/01/an-exercise-in-patience/
title: "An exercise in patience"
last_modified_at: 2007-01-13T22:24:49-05:00
categories:
  - Blog
tags:
  - boring
  - geek
  - tech
  - webmaster
---

Spent a good portion of late last night and today hacking away at a few site related things. After some stress at work,
I remembered why Javascript is still considered a pain in the ass to work with despite all the cool tools Google cranks
out with it. If you want to mix and match JS libraries, you can be in for quite a mess when you find out that they
don't play nice together. This past two weeks at work showed me that [Rico](http://openrico.org/rico/home.page), a
favorite library of mine until now, was wrecking havoc with other useful libraries. My work time has been spent finding
alternate libraries and ways of doing the same tasks.

I settled on using [Scriptaculous](http://script.aculo.us/) to replace the nifty accordion effect I use here and on the
work site. It works fairly well though there are a few issues I will likely hack on at a later date. Took about an
hour to convert the existing HTML for my [AnimeOnDVD](http://www.animeondvd.com/)
[reviews](http://www.lupinencyclopedia.com/blog/2006/08/animeondvdcom_reviews_1.php) to the new method and iron out a
few wrinkles.

However, Scriptaculous did not have a replacement for the rounded corner effect Rico could produce. After a couple of
frustrating hours, I could find no suitable library that would achieve the effect I want and not turn Scriptaculous into
a craptaculous, broken mess. Fortunately, I stumbled across [Spiffy Corners](http://www.spiffycorners.com/), a widget
that would take a few color values and spit out the CSS/HTML combo for do-it-yourself rounded corners. While the corners
are now hard coded, it does mean less Javascript in the page and one less thing to worry about breaking if another
library is added.

I wanted to ensure I could keep using Scriptaculous because of one other fantastic library I began using at work,
[Lightbox JS](http://www.huddletogether.com/projects/lightbox2/). Lightbox relies on Scriptaculous to turn a set of
images into a slick looking slide show. This left me with the final task of updating my
[Gallery](http://gallery.menalto.com/) embedding script to output the HTML needed for the slide show. This was the most
enjoyable part of the day, as I'm still in the "hack and discover" mode when working with Gallery.

If development on Rico ever produces new fruit, I'll likely check it out again and perhaps undo a few of these changes
if it meshes with Scriptaculous. I still think its accordion solution is the most fluid and easy to use available, and
it had a number of other features that were equally easy to use. For now, it was a frustrating chore to get through,
but I love the results.