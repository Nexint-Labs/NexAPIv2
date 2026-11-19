API Documentation:

Legend:
Star - Authentication locked. You must attach a JSON token. Ex: { token: "INSERT TOKEN" }

For /api/v1:
- /blacklist:
  - GET: Gets the current blacklist.
  - POST*: Adds a user to the blacklist.
  - DELETE*: Deletes a user from the blacklist.
- /advert:
  - GET: Gets the list of advertisements.
  - POST*: Adds an advertisement.
  - DELETE*: Deletes an advertisement.
- /currency:
  - Unfinished.
- /notif:
  - GET: Gets versioning info for notification systems. Weird, I know.
  - QUERY*: Sees the active notifications for a specific user. Creates a user if they don't exist.
  - POST*: Add a notify user? I don't know why you'd need this lol
  - DELETE*: Deletes a notify user.
- /opt-out:
  - GET: Gets version info of opt out API.
  - QUERY*: Queries the opt out DB, sees if someones opted out.
  - POST*: Opts out someone.
  - DELETE*: Deletes someone.