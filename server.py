#!/usr/bin/env python3
# Convenience wrapper so the tools can still be run from a checkout with
# `python3 server.py ...`. The real implementation lives in the installable
# `mdsplus_web_tools` package.

from mdsplus_web_tools.server import main

if __name__ == '__main__':
    main()
