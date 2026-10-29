
# MDSplus Web Tools

This repository contains the ongoing work to create a set of web-based tools for use with MDSplus.

These tools are provided in a development state, with no guarantee of functionality, and with features and APIs that will change.

These tools are developed for MDSplus first, but with the goal of adding support for other backends in the future. They are optimized for MDSplus data access patterns.

Currently, Firefox, Chrome, and Safari should all be supported. Mobile browsers should also work, however they have not been optimized for yet.

## Scope

Designed to replace `dwscope` and `jScope`.

Features:
* Configurable dashboard for viewing MDSplus data
* Multiple traces per panel
* Server-side cropping and downsampling
* Support for importing `.dat` and `.jscp` files
* Support for importing/exporting to/from a `.json` format
* Autosaving
* Built in [Traverser](#traverser)
  * When editing a Trace, the Open in Traverser button will open that tree/shot and reveal the node

## Traverser

Designed to replace `traverser`, `jTraverser`, and `jTraverser2`.

This feature is currently not available separately, but can be accessed as part of the Scope.

Features:
* Support for opening multiple trees/shots
* Expanding and collapsing nodes
* Tooltip with usage, status, tags, and expression information
* For Signals, the tooltip will also contain a preview plot

## Single-User Setup

To run these tools for a single user, follow these steps:
1. Clone this repository
2. Create and source a python virtual environment
  `python3 -m venv .venv` and `source .venv/bin/activate`
3. Install the package and its dependencies
  `pip install .`
4. Run the server, likely pointing at your MDSplus data server. See [Data Server Options](#data-server-options) for more information.
  `mdsplus-web-tools DATA_SERVER`
5. Open the link displayed in your terminal

Running from a checkout with `python3 server.py DATA_SERVER` is still supported and is
equivalent to the `mdsplus-web-tools` command installed in step 3.

## Site-Wide Setup

To configure these tools for an entire site, follow the instructions in [sitewide-example](./sitewide-example/README.md)

## Data Server Options

The web tools can be configured to either use an MDSplus data server, or run locally. When using an MDSplus data server, either `mdsthin` or the full `MDSplus` python package are required. When running locally, the full `MDSplus` python package is required. The recommended configuration is to use `mdsthin` with an MDSplus data server, this should achieve the best performance.

```
# Run against a MDSplus data server
python3 server.py DATA_SERVER

# Run locally, using the tree paths from this environment
python3 server.py
python3 server.py local

# Run over an SSH tunnel
python3 server.py sshp://USER@DATA_SERVER
python3 server.py ssh://USER@DATA_SERVER

# Run over an SSH tunnel with a jump host (mdsthin only)
python3 server.py sshp://USER@JUMP_HOST --ssh_port=2222 --sshp_host=DATA_SERVER
```

`USER`, `DATA_SERVER`, and `JUMP_HOST` are all placeholders.

## Future Plans

The following are planned, and feedback about them is welcome but please refrain from creating issues until the features are in a more stable state.

* Major UI overhaul with support for different resolutions
* Improved error handling
* Exporting `.dat` and `.jscp` (as a best effort)
* MDSplus Events
* Selecting the resampling algorithm used when downsampling
* TDI expression editor / validator
* TDI expression explorer / scratchpad
* Support for backends such as PostgreSQL or InfluxDB
* Authorization

## Known Issues

The following are known issues, please refrain from creating issues about them

* Large expressions in Traverser tooltip
* Slow connections or large signals break the Traverser preview plot
* Altering the configuration while the Scope is refreshing causes issues
* Using the sshp:// option with a `.ssh/config` defined Alias breaks (possibly an issue with mdsthin)