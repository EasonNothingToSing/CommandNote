"""
CommandNote - Command Note Tool
Desktop application built with MVC architecture using PyWebView
"""

from views import WebViewApp


def main():
    """Main entry point"""
    print("Starting CommandNote application...")
    app = WebViewApp()
    app.run()


if __name__ == "__main__":
    main()
