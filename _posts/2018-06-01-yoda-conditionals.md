---
permalink: /blog/2018/06/yoda-conditionals/
title: "Yoda conditionals... Change my mind I should?"
last_modified_at: 2018-06-01T13:31:01-05:00
classes: wide
categories:
  - Blog
tags:
  - technology
  - programming
  - php
header:
  image: /assets/images/traackr/yoda.jpg
---

I had another blog topic in mind but ran across the article ["The Mistakes I Made As a Beginner Programmer"](http://web.archive.org/web/20190305144856/https://medium.com/@samerbuna/the-mistakes-i-made-as-a-beginner-programmer-ac8b3e54c312).
The entire article is worth reading, but this item leaped off the page at me:

> ... avoid Yoda conditions and assignments within conditionals.

I have encountered this statement in other articles and in the coding standards for various projects. Reduced readability
is the criticism typically levied against the pattern, though they seldom elaborate on why readability suffers. I picked
up the habit of using Yoda conditionals from a former mentor, but it has never been a practice I strongly advocated using.
Perhaps, it is time to reexamine if there is any value in using it at all.

What exactly is a "Yoda conditional"? Rather than saying this

```php
<?php
if ($order === 66) {
    // Exterminate the Jedi
}
```

a Yoda conditional reverses the expression:

```php
<?php
if (66 === $order) {
    // Exterminate the Jedi
}
```

It is a coding practice where you always phrase a conditional statement with the "constant" portion, 66 in this example,
first. The goal of the practice is to avoid errors where you unintentionally perform variable assignment inside the
conditional rather than making an actual comparison.

```php
<?php
// Will always be true
if ($order = 66) {
    // Exterminate the Jedi
}
 
// Will throw an error
if (66 = $order) {
    // Exterminate the Jedi
}
```

The first conditional will always pass because variable assignment results in a truth-y value; your clone troopers will
exterminate the Jedi on every order given. Having Yoda on the field though causes an immediate disturbance in the Force.
Hidden this subtle bug is not.

There is a clear benefit here, but is it enough to trump the benefits of readable code? Is there truly a problem with it
being less readable? On the surface, there appears to be no issue. You see the "if" and know some sort of comparison will
be made. What does it matter if 66 is listed first?

Our brains do not read code the way a machine does. It makes no difference to the machine what the order is. However, say
the conditional out loud. "If sixty-six equals the order variable." "If the order variable equals sixty-six." The latter
falls into more familiar patterns of speech. Reading one slightly awkward statement may not be a big deal, but try reading
more and more of them while debugging a large code base. It will tax your mental capacity.

My development environment also includes a bevy of code sniffers and linters. They constantly remind me to use the triple
equals for equality checks along with warnings when assigning variables inside a conditional. I am less likely to fat
finger away an equal sign and end up with an assignment rather than a conditional check.

So... Hrm... Yeah, I think I finally agree; the benefit of using Yoda conditionals is not sufficient enough compared
against code readability. I would much rather have my code be easy for people to read and understand. No longer use this
pattern will I. Wait... Apologies... I will no longer use this pattern. There, that is much better.