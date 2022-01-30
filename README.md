# BestDealHelper

The mod adds 💹 & ⏳ notations, sorts buildings & upgrades which provids most CPS in minimum time.
Does NOT disable achievements.

# Features
## Best deal ratio 💹
Add **normalized\*** CPS-Acceleration ratio (xxx%) for deals.

## Forecast building upgrade
When calculating a building's CPS-Acceleration ratio, buying multiple buildings to get the next upgrade is also evaluated. If the buying chain can bring a higher ratio, the final ratio will use the later one.

## Rainbow text building to get best deal earlier
When your best deal is too expensive to buy, buying other buildings may make the best deal earlier. In this case the \*helper\* buildings' ratio will appear in rainbow colors.

## Auto sort buildings and upgrades (toggleable)
Sort buildings and upgrades by **CPS-Acceleration ratio\*** in game.

## Waiting time ⏳
Add waiting time for deals.

## Exclude wizard tower (toggleable)
Some players control the number of wizard towers to double cast Force the Hand of Fate.
In this case wizard tower is always first in the list. Where ignoring the wizard tower can help.
[https://cookieclicker.fandom.com/wiki/Grimoire](https://steamcommunity.com/linkfilter/?url=https://cookieclicker.fandom.com/wiki/Grimoire)


\* CPS-Acceleration ratio: buildings/upgrades which can gain more CPS in less payback waiting time will have higher CPS-Acceleration ratio
\* Normalized: For example \[4, 3, 2, 1\] will become \[160%, 120%, 80%, 40%\] on average 100%.
-----

# The Math

The idea is similar to Cookie Monster's PP(payback period), however Best Deal Helper aims to get the most CPS in shortest time, which is to determine the ratio **deltaCps / deltaTime** for each in-store deal.

**deltaCps** is how much CPS we can gain after a deal. so it;s

let deltaCps = newCookiesPs - Game.cookiesPs;


The newCookiesPs is determined by calling game core functions to simulate CPS after buying buildings or upgrades in a sandbox, so it's accurate, includes all related buffs and will never be outdated after each game update.

**deltaTime**: deltaTime is payback time with new CPS; If the price is unaffordable, deltaTime also includes the waiting time before a deal can be made.

if(price > Game.cookies) deltaTime = (price - Game.cookies) / cps + Game.cookies / newCps; else deltaTime = price / newCps;


The main difference between PP and CPS-Acceleration is that we take deltaCps into account.

return me.cpsAcceleration = deltaCps / deltaTime;



# Report Issues
Report at [https://github.com/jcppkkk/BestDealHelper/issues](https://steamcommunity.com/linkfilter/?url=https://github.com/jcppkkk/BestDealHelper/issues)

# Workshop
[https://steamcommunity.com/sharedfiles/filedetails/?id=2689045003](https://steamcommunity.com/sharedfiles/filedetails/?id=2689045003)

# MOD Guide
The origin mod page and more details:
[https://steamcommunity.com/sharedfiles/filedetails/?id=2599418140](https://steamcommunity.com/sharedfiles/filedetails/?id=2599418140)