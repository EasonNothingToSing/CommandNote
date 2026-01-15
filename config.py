"""Application configuration"""

import os
import sys
import warnings

def suppress_pywebview_warnings():
    """Suppress pywebview warnings and error messages"""
    # Suppress Windows accessibility warnings
    warnings.filterwarnings('ignore')
    
    # Redirect stderr to suppress pywebview error messages in production
    if getattr(sys, 'frozen', False) and not sys.stderr:
        sys.stderr = open(os.devnull, 'w')

def optimize_startup():
    """Optimize application startup"""
    # Set environment variables for better performance
    os.environ['PYWEBVIEW_GUI'] = 'edgechromium'
    
    # Suppress unnecessary warnings
    suppress_pywebview_warnings()
