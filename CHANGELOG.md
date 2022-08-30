# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2048.04] - 2022.08.30
### Add
- Changeable update interval in milliseconds

## [2048.03] - 2022.08.08
### Add
- New config to set Backing target (cookie in seconds)
- Increase text contrast

## [2048.02] - 2022.07.01
### Fix
- The calculation of rainbow deals does not take into account multiple purchases

## [2048.01] - 2022.06.03
### Fix
- Freeze at Game version 2.048

## [2043.10] - 2022.04.24
### New
- Add month as waiting time unit
- Add switch for Sort/Ignore upgrades that cause Grandmapocalypse
### Change
- Refactoring code, break down main function

## [2043.09] - 2022.04.09
### Fixed
- Fix bug with tiered upgrades -- thanks Michael Precup

## [2043.08] - 2022.03.12
### Added
- Allow change color in settings page

## [2043.07] - 2022.02.13
### Update
- Improve the calculation of the best deal helper
 
## [2043.06] - 2022.01.31
### Added
- Excluding Idleverses (togglable)

## [2043.05] - 2022.01.09
### Changed
- Rewrite buying chain calculation based on accumulated waiting time instead of accumulated price
- Use VS code ts-check and fix typing errors

## [2043.04] - 2022.01.07
### Fixed
- game hangs 0.x second after each buying

## [2043.03] - 2022.01.03
### Fixed
- CPS glitch #1

## [2043.02] - 2021.12.21
### Fixed
- Loading error with Steam Workshop version

## [2043.01] - 2021.12.21
### Changed
- Publish to Steam Workshop

## [2042.14] - 2021.09.25
### Changed
- Change: fix overestimated waiting time. the score is weighted too much on avoiding waiting, thus it increases quickly when deals are getting affordable; All good things are worth waiting for and worth fighting for.   

## [2042.13] - 2021.09.22
### Added
- Add: `cpsAcceleration` now consider multiple buying until next tier upgrade.
- Add: button to ignore Wizard Tower.

## [2042.12] - 2021.09.21
### Added
- Auto increase decimalPlaces for small number.

### Changed
- Change: rollback the algorithm about deltaTime.
- Improve: tweak layout of buildings.

### Fixed
- Fix: sort tech upgrades in their own list.
- Fix: skip sorting vaulted upgrades.

## [2042.11] - 2021.09.19
### Added
- Add: Highlight pre-deal that can advance best-deal waiting time.
- Add: Waiting time for deals.

### Changed
- Change: calc deltaTime from price / deltaCps

## [2042.10] - 2021.09.19
### Fixed
- Ignore toggle type upgrades

## [2042.9] - 2021.09.18
### Changed
- Suppress notation on 0% upgrades.
- Avoid sorting upgrades in toggle pool.

### Fixed
- Fix errors afters ascend.
- Fix that best deals do not show in blue if multiple deals have same ratio.
- Fix errors with Mile Selector.
- Fix 0% rate updates are included in normalizing process.

## [2042.8] - 2021.09.18
### Fixed
- Fix "raw cookies per second" get changed incorrect. However, this Mod cannot detect whether your stat is correct or incorrectly; Please export your save, visit https://coderpatsy.bitbucket.io/cookies/editor.html, change `Highest raw CpS` to 0 and import modified save back to fix the value.

### Changed
- Grandmapocalypse related upgrades are set to 0%, including "One mind", "Communal brainsweep", "Elder pact".


## [2042.7] - 2021.09.18
### Added
- Include upgrades now!

### Changed
- Improve: change The metric of deal quality from `Price–PerBuildingCPS ratio` to `cpsAcceleration ratio`, in order to gain most cps in the shortest time.
- Improve: hue for notations.

## [2042.6] - 2021.09.15
### Fixed
- Loading error about CCSE init

## [2042.5] - 2021.09.15
### Added
- Colors!

### Changed
- Improve efficiency of sorting buildings. Only sort them if the order has changed.

## [2042.4] - 2021.09.13
### Fixed
- Normalized notation cause price flickering

## [2042.3] - 2021.09.13
### Added
- Button to toggle sorting buildings.

### Changed
- Require CCSE now.

## [2042.2] - 2021.09.12
### Fixed
- Normalized notation does not show after enter/leave Frenzy.

## [2042.1] - 2021.09.11
### Added
- Sort buildings by gained CPS / price per building.
- Show normalized notation of `gained CPS / price` of buildings for comparing.
