# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2042.10] - 2021-09-19
### Fixed
- Ignore toggle type upgrades

## [2042.9] - 2021-09-18
### Changed
- Suppress notation on 0% upgrades.
- Avoid sorting upgrades in toggle pool. 

### Fixed
- Fix errors afters ascend.
- Fix that best deals do not show in blue if multiple deals have same ratio.
- Fix errors with Mile Selector.
- Fix 0% rate updates are included in normalizing process.

## [2042.8] - 2021-09-18
### Fixed
- Fix "raw cookies per second" get changed incorrect. However, this Mod cannot detect whether your stat is correct or incorrectly; Please export your save, visit https://coderpatsy.bitbucket.io/cookies/editor.html, change `Highest raw CpS` to 0 and import modified save back to fix the value.

### Changed
- Grandmapocalypse related upgrades are set to 0%, including "One mind", "Communal brainsweep", "Elder pact". 


## [2042.7] - 2021-09-18
### Added
- Include upgrades now!

### Changed
- Improve: change The metric of deal quality from `Price–PerBuildingCPS ratio` to `cpsAcceleration ratio`, in order to gain most cps in the shortest time.
- Improve: hue for notations.

## [2042.6] - 2021-09-15
### Fixed
- Loading error about CCSE init

## [2042.5] - 2021-09-15
### Added
- Colors!

### Changed
- Improve efficiency of sorting buildings. Only sort them if the order has changed.

## [2042.4] - 2021-09-13
### Fixed
- Normalized notation cause price flickering

## [2042.3] - 2021-09-13
### Added
- Button to toggle sorting buildings.

### Changed
- Require CCSE now.

## [2042.2] - 2021-09-12
### Fixed
- Normalized notation does not show after enter/leave Frenzy.

## [2042.1] - 2021-09-11
### Added
- Sort buildings by gained CPS / price per building.
- Show normalized notation of `gained CPS / price` of buildings for comparing.
