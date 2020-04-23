---
permalink: /blog/2017/08/adventures-in-two-factor-auth/
title: "Adventures in Two Factor Authentication"
last_modified_at: 2017-08-04T13:31:01-05:00
classes: wide
categories:
  - Blog
tags:
  - technology
  - programming
  - php
header:
  image: /assets/images/traackr/2fa.png
---

## Off we go!
Another hack week was upon us, and I had a definite idea in mind. I wanted to add two factor authentication to our web
application. Having enabled it on web sites I use regularly, I was curious to see how difficult it was to implement and
learn about the best practices associated with it. A bare bones implementation turned out to be remarkably trivial.

Our application runs on PHP, and it took minimal Google-fu to determine the [RobThree/TwoFactorAuth](https://github.com/RobThree/TwoFactorAuth)
library was the best option to try first — well maintained, great documentation. One quick

```bash
composer require RobThree/TwoFactorAuth
```

to pull the library in, and it was right into setting it up. First hurdle reached! Our authentication code needed some
tender loving refactoring to be able to support having two factor authentication enabled for your login or not. Ah... the
satisfaction of being able to clean code up including squashing a bug that has long irritated you...

Once the authentication code was cleaned up, actually adding two factor authentication was trivial. It took more time to
refactor our existing code than it did to use the library to generate the shared secret, display the QR code for scanning,
and verify the entered token against the shared secret.

## Which thirds to invite to the party?
By default, the PHP library reaches out to an external Google service to generate the QR code. However, you can use a
local library to generate it if security of sending the shared secret over the wire is a concern. Hrm... Should I be
concerned about that? Should I use an external third party service for generating QR codes, or should I compose in another
third party library into our application?

Did a bit of research and found no compelling argument either way. Thinking it through, let's say I use an external third
party and send the shared secret to them. What is the attack surface? They could sniff and record the secret, but they
get no other details. How would they tie it back and use it with an actual username? They would need access to our
database or server to make that association. If they have that, the game is already up, and they likely don't care or
need the secret anyway.

What other drawbacks might there be then? There are two that spring to mind. First is the need to make an HTTP request
to the service to get the QR code back. You are now dependent on the service being up and the network being fast and
stable between you and the service. Second is the (likely) closed nature of the service; you have no way of vetting the
code to make sure there are no shenanigans behind the curtain.

Given all of that, I stuck with the default Google service. Google knows just a little bit about keeping a service up
and running, and their QR code service has likely been battle tested as much if not more than any other third party
library I could use locally. However, the RobThree documentation provides an easy example of using a local library should
the need or desire to switch arise.

## Drifting away...
It was demo day; time to practice before presenting my work to the rest of the team! I'll just plug in my username and
password... Type in the token from my device, and... Wait... Why am I not logged in? What did I break with my last
commit?! All my work is for naught! I'm a frauuuud!

OK... OK... calm down... There must be a logical explanation. What would make a token work yesterday but not today? This
is a time based protocol... My phone is setup to automatically keep my time correct. Let's check the time on my server...
AHA! My local vagrant instance is not running any time synchronization and has decided to drift away by about an hour.
One quick NTP query to fix that, and... We're back in business! Whew... Crisis averted; demo proceeds without issue.

I've learned an important lesson about TOTP. Make sure your server is automatically keeping the time correct!

## Dude... Where's my phone?
If you are like me, you have used two factor authentication on other sites and have come across “recovery codes”. These
are meant to be written down and stored offline; if you were to ever lose the device that generated the token for the
site, you could enter one of these codes to complete authentication and establish the shared secret on a new device.
While I had an idea in mind of how this could be implemented, I wanted to see if there were any established best practices
people follow. How many codes should be generated? How should you generate each code? What is the best way to securely
store them?

After some digging, I found... nothing. I've seen sites provide anywhere from five to ten codes with the codes varying
in length. I have yet to implement this feature but am leaning to at least generating five codes. However I end up
generating them, I will store them exactly like passwords — as encrypted salted hashes.

## I need more...
One other flow I have encountered with other two factor enabled sites is the need to input multiple tokens if the server
seems to think your token is out of sync. Again, I could find no information on best practices. How many tries should
you give the user before entering this flow? How many tokens should you ask for? Does this really add any security value?
For now, I am unlikely to implement this flow. While some big names use it, I'm not seeing much benefit from this flow
versus just allowing the user to keep entering a single token.

## That's all folks!
The RobThree library made it easy to add two factor authentication to our application. Follow the examples in the
documentation, and you'll be up and running in no time. However, there seem to be no best practices (none I could easily
surface at least) around the items like recovery codes and "out of sync... give us more than one token to proceed". Did
I miss anything? Have any best practices from your own implementations? Sound off in the comments and let me know.