---
permalink: /blog/2018/05/pipeline-for-cleaning-up-tech-debt/
title: "A pipeline for cleaning up technical debt?"
last_modified_at: 2018-05-18T13:31:01-05:00
classes: wide
categories:
  - Blog
tags:
  - technology
  - programming
  - php
header:
  image: /assets/images/traackr/pipelines.jpg
---

Traackr's customer facing application is built on top of [CakePHP](https://cakephp.org/) and has accumulated its fair
share of technical debt over time. One particular piece of debt weighed on my mind. Our application fetches a core set
of data from an API and then augments it with additional data our customers have entered. A single method handles
augmenting the initial data through a series of transformations. This beast of a method cannot be tested. There are far
too many pieces going on to write maintainable tests. It was long overdue for a refactor, and there was a particular
pattern and accompanying package I wanted to try out.

## A Pipeline for Success?
I decided to use the [Pipeline](http://pipeline.thephpleague.com/) library from [The League of Extraordinary Packages](http://thephpleague.com/)
for a few reasons. First, the pattern lends itself to writing code that does one thing and one thing very well. Here is
a sample pipe:

```php
<?php
 
use League\Pipeline\StageInterface;
 
class InfluencerAssociatedAccounts implements StageInterface
{
    protected $mAccount;
    protected $mAssociatedAccounts;
 
    public function __construct($pAssociatedAccounts, $pAccount)
    {
        $this->mAssociatedAccounts = $pAssociatedAccounts;
        $this->mAccount = $pAccount;
    }
 
    public function __invoke($pPayload)
    {
        $result = [];
 
        if (!empty($this->mAssociatedAccounts) && isset($pPayload['other_tags'])) {
            $accountNames = $this->mAccount->find('all', [
                'fields' => [
                    'id',
                    'name'
                ],
 
                'conditions' => [
                    'id' => array_keys($this->mAssociatedAccounts)
                ]
            ]);
 
            foreach ($pPayload['other_tags'] as $otherTag) {
                $acctId = array_search($otherTag, $this->mAssociatedAccounts);
                if (false !== $acctId) {
                    $result[] = [
                        'id' => $acctId
                    ];
                }
            }
 
        }
 
        $pPayload['associated_accounts'] = $result;
 
        return $pPayload;
    }
}
```

A pipe is invoked and passed a single parameter, a payload of data. You act upon that payload and then return it for the
next pipe to use or to be used as the final output of the entire pipeline. Given you can chain any number of pipes
together, your logic can be focused on performing a single task. This in turn leads to being able to write and maintain
unit tests for a pipe.

Second, it introduces a level of reuse the beast method could not. Each pipe is a reusable element we can chain together
in any fashion. If we only needed to augment the data with a small subset of our customer data, this could easily be
done by putting together a different pipeline. For example, here is our entire augmentation pipeline:

```php
$pipeline = (new Pipeline)
    ->pipe(new AssociatedAccounts($associatedAccts, $this->Account))
    ->pipe(new Sort)
    ->pipe(new Notes($account_id, $this->UserUtil, $this->InfNote))
    ->pipe(new Projects($account_id, $user, $this->ProjectUtil, $this->SegmentUtil))
    ->pipe(new CustomerDefinedTags($account_id, $this->TagUtil))
    ->pipe(new IsStarred($user_id, $this->TagUtil))
    ->pipe(new InAccountNetwork($account_id, $user, $this->SegmentUtil))
    ->pipe(new Owners($account_id, $user, $this, $this->AccountUtil))
    ->pipe(new RelationshipStage($account_id, $this->FunnelUtil, $this))
    ->pipe(new AccountContactData($account_id, $this, $this->InfData, $this->InfDataField))
    ->pipe(new Emails)
    ->pipe(new TwitterHandles($this->Util))
    ->pipe(new NormalizeValues($account_id, $user, $sort, $this->AppSettings, $this->UserUtil, $this->Util, $this->Account));
```

Just need to augment the data with notes and projects? Simple:

```php
$pipeline = (new Pipeline)
    ->pipe(new Notes($account_id, $this->UserUtil, $this->InfNote))
    ->pipe(new Projects($account_id, $user, $this->ProjectUtil, $this->SegmentUtil))
```

Small, easy to read classes... Classes that are easy to test and maintain... Easy to reuse items in a flexible way... Yes,
please!

## How's It Flowin'?
Excitement must be tempered with reality though. Yes, the beast may be bloated, but it does run very fast. Would this
pipeline run just as fast? The initial results were... not promising. The augmentation was not horribly slow, but it was
noticeably slower. Timing logic revealed the beast ran under half a second on average, while the pipeline was running a
full second on average.

Why is this approach slower? I cannot provide concrete answers, but I have a theory. Notice the pipes in our full pipeline
take in a number of arguments like `$this->InfData` or `$this->TagUtil`. These are CakePHP component and model classes.
My best guess is there is some overhead in having these items passed around into the pipe classes. The beast does not
suffer from this overhead because the framework has already bootstrapped those classes and made it available.

## So... Now what?
While the execution time of the pipeline makes using it impractical, it was worth the effort to go through the exercise.
Yes, we may not be able to use these pipe classes, but they and their tests can easily be ported back into CakePHP
component methods. We will still get the benefit of small, easy to test, and reusable units of code.

This library may not be used in conjunction with our CakePHP code base, but it is certainly a tool I will reach for
outside of that context. More importantly, using it reinforces the mind set of writing small, testable code. And that,
more than any library or tool, is the best pipeline towards reducing your technical debt.