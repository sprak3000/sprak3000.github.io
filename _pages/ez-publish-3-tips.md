---
permalink: /ez-publish-3-tips/
title: "eZ Publish 3.X Tips"
toc: true
toc_label: "Table of Contents"
---

# Overview
These are tips, notes, hints, etc. I've written down over time when coding up eZ Publish based solutions. The tips are
only for 3.X but might work for later versions; no guarantees... My eZ Publish days are behind me for now. 

# Toolbars
## Step 1: Create an override file and define the Toolbar/Tools.
1.  Create or edit the override file at `<ezroot>/settings/override/toolbar.ini.append.php`
1. Define the toolbar:
   ```ini
   # What toolbars are available
   [Toolbar]
   AvailableToolBarArray[]
   AvailableToolBarArray[] = <toolbar name>
   ```
1. Define the tools available on that bar:
   ```ini
   # New Tool
   [Tool_<name>]
   <attribute name> = <value | null>
   ```
1. Define the tool description(s):
   ```ini
   # Text for form field labels
   [Tool_<name>_description]
   <attribute name> = <text>
   ```

eZ defines the form view of tool attributes in `<ezroot>/design/admin/templates/visual/toolbar.tpl`.

In that file, it has pre-defined behavior for attribute names ending in `_node`, `_classidentifier`, `_classidentifiers`,
`_subtree`, `_check` (e.g., `foo_node`, `bar_check`). Everything else is displayed as a text field. 

## Step 2: Create templates for displaying the tools.
Templates should be created in the design directory for the `siteaccess` you want to use it in. e.g., 
`<ezroot>/design/en/override/templates/toolbar/<full | line>/<tool name from toolbar.ini>.tpl`

# Custom Login Handler
1. Create the extension layout (need to double check these paths; possible transcription error...):
   ```ini
   <ezroot>/extension/<extension name>
   <ezroot>/login_handler/ez<class name>user.php
   <ezroot>/settings/site.ini.append.php
   ```
1. Create the login code in skeleton `ez<class name>user.php`
   ```php
   <?php
   class eZ<class name>User extends eZUser
   {
     function eZ<class name>User { }

     function &loginUser ( $login, $password,
                  $authenticationMatch = false ) {
       // Must return false for failure
       // or eZUser object
     }
   }
   ```
1. To use the custom login for site accesses in `site.ini.append.php`:
   ```ini
   [UserSettings]
   LoginHandler[] = <class name>
   ExtensionDirectory[] = <extension name>
   # To prevent use of standard login w/email address
   AuthenticateMatch = login
   ```
# Datatype
Options when adding a datatype to a class require a template in `<ezroot>/design/standard/templates/class/datatype/edit/`.

Define the form to display when creating an object whose class includes datatype templates:
1. Template when editing object: `<ezroot>/design/standard/templates/content/datatype/edit/`
1. Template when viewing the object: `<ezroot>/design/standard/templates/content/datatype/view/`

# Lucene Indexing
1. Create:
  * Document (set of fields, unit of index/search)
  * Field Store, Field Index, Field Term Vector (constants for saying if & how field is stored)
1. Parse `lucene.ini`
  * Read boost info for attributes, classes, meta fields, data types of eZ classes/objects.
  * Read reverse related scale
1. Perform boosts
  * If class of current eZ object in list, boost the Document.
  * Add reverse related object count to Document boost value.
1. Initialize meta fields: keyword, text, & sort attributes
1. Create Fields in Document:
  * Keyword attributes w/boost if needed
  * Text attributes w/boost if needed
  * Sort attributes w/boost if needed
  * Object owner
  * Main node (url alias!)
  * Assigned nodes (alt locations? url alias!)
  * Content object attributes (current version & translation) w/boost if needed
1. Write Document to index

## During Indexing
`$object: ClassName = File & ClassIdentifier = File`
`lucene.php line 410`
```
$currentVersion->attribute('data_map')
    |
    |___>['file']->content()
    |                |
    |                |__________>StoredFileInfo()
    |                                     |
    |___>attribute('filepath')            |_____>filepath
    |                                     |
    |___>attribute('mime_type_part')      |_____>mime_type
                              |                    |
                              |__>pdf, xml, etc.   |
                                                   |___>attribute
                                               ('mime_type_part')
```