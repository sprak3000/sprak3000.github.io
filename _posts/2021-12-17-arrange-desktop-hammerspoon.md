---
permalink: /blog/2021/12/arrange-desktop-hammerspoon/
title: "Hammerspoon your way to a tidy desktop"
last_modified_at: 2021-12-17T22:13:01-05:00
classes: wide
categories:
  - Blog
tags:
  - technology
  - programming
  - geek
  - open source
  - os x
---

I can be a very particular individual. My application windows must be arranged just so... Each in just the right size
and in the right position. As my laptop migrated from home to office, it was hooked up to different sets of external
monitors. This lead to the problem of having to reposition and size my windows everytime I swapped monitors. It occurred
to me there must be a better way, a way to automate this process and have my windows size and locate themselves with
ease. I never foresaw my journey leading me to the power of the [Hammerspoon](https://www.hammerspoon.org/).

What is Hammerspoon you ask?
> This is a tool for powerful automation of OS X. At its core, Hammerspoon is just a bridge between the operating system
> and a Lua scripting engine. What gives Hammerspoon its power is a set of extensions that expose specific pieces of
> system functionality, to the user.

[Lua](https://www.lua.org/) scripting? Are there not apps available for this task? Yes, they are legion, but none of
them were quite what I wanted. Most tools concern themselves with locking windows to set grid patterns. Hit this key to
anchor your window to the top left. This key will arrange windows side by side. Again, I am _very_ particular about how
I size and place my windows. I needed fine-grained control over things, and I had wanted to tinker with Lua scripting
for some time.

But... I bet someone has already written a Hammerspoon... Spoon? Really? They call their plugins Spoons? Why not
Hammers? Good question... I've never actually thought about it until just now. Either way, we're getting off track.
People have written Spoons for this task. I began my Hammerspoon / Lua journey by using
[Hammerspoon Window Manager](https://github.com/dploeger/hammerspoon-window-manager) by Dennis Ploeger. It was fairly
straightforward to read and figure out how to set it up for my configurations.

As I dug in to understanding the _how_ behind it, my mind began to race with ways to improve on this. Setting up a new
configuration was a very manual process. Could I rework this logic to detect the current positions of the windows and
auto generate the configuration for you?

After a few months and several iterations, I finally had written my first Spoon! It satisfied both my need to arrange
my application windows on my desktop precisely and my desire to learn Lua. A pull request later to the
official repo, and [ArrangeDesktop](https://www.hammerspoon.org/Spoons/ArrangeDesktop.html) was live!

While it was live, it did not feel particularly friendly to use. There were too many steps to get your arrangement setup
and usable. I let it languish in this state until someone contacted me about how to use it. That did it... I had to
improve this, make it simple to use. A month of tinkering led to something finally worth writing about.

**NOTE:** The remainder of the article assumes you have Hammerspoon installed and are familiar with its basic structure
and configuration. If not, refer to the ["Hammerspoon Getting Started"](https://www.hammerspoon.org/go/) guide.
{: .notice--info}

How does it work then? Start by [downloading ArrangeDesktop](https://github.com/Hammerspoon/Spoons/raw/master/Spoons/ArrangeDesktop.spoon.zip)
and [installing it](https://github.com/Hammerspoon/hammerspoon/blob/master/SPOONS.md#how-do-i-install-a-spoon). Next,
we need to modify your Hammerspoon `init.lua` to load the spoon and add its menu items.

```
arrangeDesktop = hs.loadSpoon('ArrangeDesktop')
arrangeDesktop.logger.setLogLevel('info')
menubar = hs.menubar.new()
```

These initial lines load the spoon, set its default logging level, and creates a new menubar. If we have a valid menubar,
we set it up with Arrange Desktop's menu items.

```
if menubar then
    menubar:setIcon(hs.image.imageFromName("NSHandCursor"))
    local menuItems = {}
    menuItems = arrangeDesktop:addMenuItems(menuItems)
    menubar:setMenu(menuItems)
end
```

You have successfully configured Arrange Desktop! Reload your Hammerspoon configuration, and you will now have a menubar
item with one option -- `Create Desktop Arrangement`.

![image-center](/assets/images/arrange-desktop/arrange-desktop-initial-menu.png){: .align-center}

Arrange your desktop windows how you like them -- size, position, etc. Are you happy with your desktop layout? Then
click that `Create Desktop Arrangment` menu item! An explanatory dialog appears allowing you to either continue or cancel
the process.

![image-center](/assets/images/arrange-desktop/arrange-desktop-first-step.png){: .align-center}

Proceed and you give your desktop arrangement a name.

![image-center](/assets/images/arrange-desktop/arrange-desktop-name-your-arrangement.png){: .align-center}

Another explanatory dialog appears informing you how the process works. Arrange Desktop switches focus to each
application to record its details.

![image-center](/assets/images/arrange-desktop/arrange-desktop-how-it-works.png){: .align-center}

The first window focus on each monitor triggers one more dialog letting you name that particular monitor.

![image-center](/assets/images/arrange-desktop/arrange-desktop-name-monitor.png){: .align-center}

Once all the windows are recorded, a final message appears.

![image-center](/assets/images/arrange-desktop/arrange-desktop-success-message.png){: .align-center}

You now wield the power to switch your desktop layouts with a click of your mouse!

![image-center](/assets/images/arrange-desktop/arrange-desktop-arrangement-items.png){: .align-center}

**INFO:** Some applications have phantom windows that appear on a different monitor than the actual application window.
You may need to edit your configuration to weed out these "duplicates".
{: .notice--info}

My Spoon does not address the use of [Spaces](https://support.apple.com/guide/mac-help/work-in-multiple-spaces-mh14112/mac).
Dennis' code does account for Spaces, but they fall under an undocumented API. While trying to get Arrange Desktop to
work, I found Spaces data to be unreliable. The IDs for them would frequently change making it difficult to restore to
them consistently. Given access to multiple monitors, I have not used Spaces in a long time and decided to omit support
for them. Perhaps I will give it another go down the line.

That said, I am very pleased with Hammerspoon in general and how ArrangeDesktop came out. I'll give one last hat tip to
Dennis Ploeger. My plugin stands on the shoulders of his work. Now go out there and tidy up your own desktops!
