"""
CommandNote - Command Note Tool
Desktop application built with MVC architecture using PyWebView
"""

from views import WebViewApp
from config import optimize_startup


def main():
    """Main entry point"""
    # Optimize startup and suppress warnings
    optimize_startup()
    
    app = WebViewApp()
    app.run()


if __name__ == "__main__":
    main()
