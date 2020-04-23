---
permalink: /blog/2018/06/fresh-baked-roles-zend-permissions-rbac/
title: "Fresh Baked Roles with Zend Permissions RBAC"
last_modified_at: 2018-06-01T13:31:01-05:00
classes: wide
categories:
  - Blog
tags:
  - technology
  - programming
  - php
header:
  image: /assets/images/traackr/baked-rolls.jpg
---

As our Traackr application has grown, so has our need to restrict access to features or pieces of features. Recently, our
search feature added new filters to use. However, some of these filters are only meant to be available to enterprise
customers. This was not a new problem for us; our analytics feature added a new report type, one only enterprise
customers should have.

Feature flags were our initial solution to both efforts. This worked well enough for our analytics use case. Our customer
success team attaches an account to the feature flag, and the account can view the new report. Cracks started showing in
this approach when applied to our search effort.

Let's say we added four new filters to search. That is four new feature flags to create, not a terrible burden from a
coding standpoint. But our poor customer success team... They now have to go account by account and flip four new switches
to make sure the account has access to the search filters granted to them by their subscription. Yuck...

## Role-based Access Control to the Rescue!
During one of our hack weeks, I had tinkered with the [Zend Permissions RBAC](https://zendframework.github.io/zend-permissions-rbac/intro/)
package without a solid use case in mind. It was just an interesting concept that crossed my path at the time. Now, it
seemed a perfect use case for it was in front of me. Before we dive into details, we should first answer an important question.

## What is role-based access control (RBAC)?
A standard access control list (ACL) focuses on objects and who can act on them. Your computer's file system is an example
of an ACL. Using a Linux file system, each file and directory is an object. The ACL for a file contains three entities —
the owner of the object, the group associated with the object, and everyone else. A feature in our application would be
an object, and the feature flag ended up being the ACL attached to it.

The statement ACL makes is "This object is associated with these people, and each person can access the object in specific
ways". Phrased in the context of our application, "this feature can be accessed by the following accounts."

How does RBAC differ then? I'll let the package's documentation make the initial introduction:

> RBAC differs from access control lists (ACL) by putting the emphasis on roles and their permissions rather than objects (resources).

RBAC makes the statement "These people are associated with these roles. These roles grant them these permissions." Again,
in the context of our application, the statement becomes "This account is associated with this role. This role allows
them access to these features." This concept has an immediate benefit for us. Accounts can be granted a specific role.
As we add a new feature, we update the role to have new permissions for the feature, and every account is automatically
able to use the feature. No longer do we need to edit accounts individually.

## Baking up our roles
Let's start building this out! We first need to define our roles and the permissions associated with them. Here is a
stripped down version of our class to manage that:

```php
<?php
use Zend\Permissions\Rbac\Role;
 
class AccountSubscriptions
{
    const ROLE_SUBSCRIPTION_ENTERPRISE = 'subscription.account.enterprise';
 
    const ROLE_SEARCH = 'search';
 
    const PERMISSION_SEARCH = 'search';
    const PERMISSION_SEARCH_TOPICS = 'search.topics';
    const PERMISSION_SEARCH_BRANDS = 'search.brands';
    const PERMISSION_SEARCH_LOCATIONS = 'search.locations';
 
    /**
     * @return Role
     */
    public function enterprisePackage():Role
    {
        $package = new Role(self::ROLE_SUBSCRIPTION_ENTERPRISE);
 
        $search = new Role(self::ROLE_SEARCH);
 
        $search->addPermission(self::PERMISSION_SEARCH);
        $search->addPermission(self::PERMISSION_SEARCH_TOPICS);
        $search->addPermission(self::PERMISSION_SEARCH_BRANDS);
        $search->addPermission(self::PERMISSION_SEARCH_LOCATIONS);
 
        $package->addChild($search);
 
        return $package;
    }
}
```

Our "Enterprise Subscription Package" starts with a parent role representing just the subscription for the account. It
contains no feature specific permissions and would contain more general permissions instead — number of users allowed in
the account, number of concurrent logins, quotas, etc. A child "Search" role is added to the subscription role. Within
the "Search" role we grant permission (`search`) to use the search feature and grant permission to use the topic (`search.topics`),
brand (`search.brands`), and location (`search.locations`) filters. The dot notation is our own convention for role and
permissions names. Names can be any string, but this gives us a visual hierarchy of the pieces of a feature.

## May I?
When a customer logs into our site, we check the subscription attached to their account and attach the appropriate `Role`
object to their session. Our search page must now check they can access the page, and if so, what filters they should see.

```php
<?php
$role = $user->role();
 
$searchEnabled = false;
if ($role->hasRole(AccountSubscriptions::ROLE_SEARCH) &&
        $role->isGranted(AccountSubscriptions::ROLE_SEARCH, AccountSubscriptions::PERMISSION_SEARCH)) {
    $searchEnabled = true;
}
 
$topicFilterEnabled = false;
if ($role->hasRole(AccountSubscriptions::ROLE_SEARCH) &&
        $role->isGranted(AccountSubscriptions::ROLE_SEARCH, AccountSubscriptions::PERMISSION_SEARCH_TOPICS)) {
    $topicFilterEnabled = true;
}
 
// etc.
```

## That smells good...

The sample checks above may not seem much different than what you would do with features flags. We are just replacing "are
they on this feature flag" with "do they have this role and permission". The benefit here is in the ease of maintenance,
especially for managing accounts and features. Using RBAC, a new feature is added to a role, that role attached to a
subscription, and that role addition / subscription update is shipped with the feature. Every account tied to that
subscription has immediate access to the feature. Our customer success team no longer has to take time to turn the
feature on for an account.

RBAC has also made it easy to extend the system even further. As an example, we built an override and exclusion system
on top of it. If a customer abuses the location search feature, we can shut it off just for them. Need an incentive for
a customer to upgrade? We can override the permissions to allow them access to a feature for a short time.

We will be migrating our existing feature flagged based items to RBAC. Using it has also sparked ways to improve other
areas of our code, particularly user based permissions. Our code and process has been much more manageable since we
baked RBAC into it. But don't take my word; give the recipe a try for yourself.
