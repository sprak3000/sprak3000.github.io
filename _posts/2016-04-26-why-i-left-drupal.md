---
permalink: /blog/2016/04/why-i-left-drupal/
title: "Why I Left Drupal"
last_modified_at: 2016-04-26T19:22:58-05:00
classes: wide
categories:
  - Blog
tags:
  - tech
  - php
  - programming
---

## Background

Personally and professionally, I've used a number of CMS -- Mambo / Joomla, MoveableType, eZ publish, Wordpress, Drupal. None of them has left me saying "Wow, can't wait to use / develop for that tool again!" Each CMS has its quirks causing some form of learning curve and outright frustration developing for it. We were using Drupal 7 at my previous job; while I've kept up a bit on what is going on with Drupal 8, my experience with 7 has left me leary of diving back into it.

Oddly enough, I just had a Drupal article published this month. It was a talk I've been shopping around to conferences more as a "advanced composer usage" talk based on my time working with Drupal and trying to make it CI friendly. So... Why did I leave Drupal...

## The Learning Curve

Every new tool you use is going to have a learning curve. You're going to make mistakes and do things in the worst way possible. The key is how well the tool and its community help make that curve less steep and teach you best practices. Drupal 7 had a long way to go; take its documentation. The [list of hooks you can implement](https://api.drupal.org/api/drupal/includes!module.inc/group/hooks/7.x) is just that -- a big list you have to trudge through to try to find something to help you. Why isn't this list broken in to categories with a handy table of contents?

Now, let's say you've found a likely hook candidate; let's go with [`hook_form_alter()`](https://api.drupal.org/api/drupal/modules!system!system.api.php/function/hook_form_alter/7.x). Hrm... It mentions there are two other hooks where I can target a specific form or a form/forms via a base form. Base form? What is that? I'll have to hunt through the documentation because the phrase "base form" isn't linked to anything. Oh, this hook takes some parameters -- nested arrays, keyed arrays, etc. But, nothing helping me understand what the structure of those arrays are. There is a "See also" link below the parameter list; the `forms_api_reference.html` link (great title!) helps you understand what is in the `$form` parameter, but there is nothing on the page guiding you to that connection.

The documentation, on the surface, looks great. However, having the base code there does not aid in understanding. Most of the time, you are having to `var_dump` things out to understand the structure and then start a trial and error process to understand why your change isn't taking hold. Now, extend that to understanding how to creating themes, overriding templates, using custom node types, etc. There's a lot of power under the hood for Drupal, but you'll be crashing into the wall quite often trying to understand it.

My "favorite" experience with Drupal documenation, and the lack thereof, was Google'ing for two months for an answer on how to get Drupal to use templates in my custom module. I finally stumbled across the magic set of keywords that surfaced an obscure blog post. It had a code snippet that solved my problem, a snippet that was re-used as we created more modules. Why wasn't this easily found in the Drupal documentation?

## No Support for a "Modern" Workflow

Drupal is great if you want to do everything live. Want to setup a QA server for people to have content visible internally and then migrate it to a production server? We had to; our content was generally secret and time sensitive. Leaks of any kind would be disasterous, so we needed internal only servers for people to use and approve content. Well, good luck moving that content from server to server, especially if you are trying to migrate content that is tied to a custom node type. This was a constant source of frustration that required us to constantly roll up a new solution to migrate content.

## Upgrade Pain Points

Oh, you want to upgrade more than one module to keep up with security updates? You're better off running those module upgrades one at a time. Drupal's upgrade system has no way to specify an order of operations; we constantly ran into situations where upgrading one module before another caused the system to crash. Time to write custom upgrade hooks to manually do what the module's upgrade hook is meant to do, all because we can't say "make sure to upgrade X before Y".

## Will I Ever Go Back?

Do I hate Drupal 7? No, it is a very powerful system that can do amazing things. But, being away from it for a year plus and looking through old code now... I just don't want to try to relearn all of the baggage behind the curtain. If I were to come back, it would probably be under the banner of "Headless Drupal" many seem to be headed towards.

Use Drupal 8 as the CMS interface for adding content, but use the API layer for something other than Drupal's rendering engine to pull content and display it. But then again, would I really need all that power for such a thing? Why not a really light weight UI for managing and entering content and then possibly a static site generator like Sculpin to publish the page? Having built Drupal sites for ~three years, the fancy content types and such seemed to be more headache compared to the pay off. We could have just built a static page faster...
