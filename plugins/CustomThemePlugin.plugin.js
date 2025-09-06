/**
 * @name CustomThemePlugin
 * @version 1.0.0
 * @description Adds a custom theme feature to Discord with live preview and customization
 * @author Mirai
 * @authorId I have no idea where to get the author id, I looked in the documentation and there was nothing written about it.
 * @website https://github.com/MiraiDevv/BetterDiscordAddons
 * @source https://github.com/MiraiDevv/BetterDiscordAddons
 * @updateUrl https://raw.githubusercontent.com/MiraiDevv/BetterDiscordAddons/refs/heads/main/plugins/CustomThemePlugin.plugin.js
 */

module.exports = class CustomThemePlugin {
    getName() {
        return "CustomThemePlugin";
    }

    getDescription() {
        return "Adds a custom theme feature to Discord with live preview and customization";
    }

    getVersion() {
        return "1.0.0";
    }

    getAuthor() {
        return "MiraiDevv";
    }

    constructor(meta) {
        this.defaultSettings = {
            enabled: true,
            colors: {
                primary: "#5865F2",
                secondary: "#4752C4",
                tertiary: "#36393f",
                accent: "#747f8d",
                background: "#36393f",
                text: "#dcddde"
            },
            customCSS: ""
        };

        // Store meta reference
        this.meta = meta;

        // Setup compatibility layer for different BetterDiscord API versions
        this.setupCompatibilityLayer();

        // Load settings after compatibility layer is set up
        this.settings = this.loadSettings();
    }

    setupCompatibilityLayer() {
        try {
            // Create a compatibility layer to handle different BetterDiscord API versions
            this.BdApi = {
                // Data methods
                getData: (pluginName, key) => {
                    try {
                        if (window.BdApi?.Data?.load) {
                            return BdApi.Data.load(pluginName, key);
                        } else if (window.BdApi?.loadData) {
                            return BdApi.loadData(pluginName, key);
                        }
                    } catch (error) {
                        console.error("[CustomThemePlugin] Error in getData:", error);
                    }
                    return null;
                },
                saveData: (pluginName, key, data) => {
                    try {
                        if (window.BdApi?.Data?.save) {
                            BdApi.Data.save(pluginName, key, data);
                        } else if (window.BdApi?.saveData) {
                            BdApi.saveData(pluginName, key, data);
                        }
                    } catch (error) {
                        console.error("[CustomThemePlugin] Error in saveData:", error);
                    }
                },
                // UI methods
                showSettingsModal: (title, panel) => {
                    try {
                        if (window.BdApi?.UI?.showSettingsModal) {
                            BdApi.UI.showSettingsModal(title, panel);
                        } else if (window.BdApi?.showSettingsModal) {
                            BdApi.showSettingsModal(title, panel);
                        }
                    } catch (error) {
                        console.error("[CustomThemePlugin] Error in showSettingsModal:", error);
                    }
                },
                // Webpack methods
                findModule: (filter) => {
                    try {
                        if (window.BdApi?.Webpack?.getModule) {
                            return BdApi.Webpack.getModule(filter, {searchExports: true});
                        } else if (window.BdApi?.findModule) {
                            return BdApi.findModule(filter);
                        }
                    } catch (error) {
                        console.error("[CustomThemePlugin] Error in findModule:", error);
                    }
                    return null;
                }
            };
        } catch (error) {
            console.error("[CustomThemePlugin] Error in setupCompatibilityLayer:", error);
        }
    }

    getName() {return "CustomThemePlugin";}
    getDescription() {return "Adds a custom theme feature to Discord with live preview and customization";}
    getVersion() {return "1.0.0";}
    getAuthor() {return "YourName";}

    start() {
        try {
            // Ensure BdApi is available before proceeding
            if (!window.BdApi) {
                console.error("[CustomThemePlugin] BdApi is not available, plugin cannot start");
                return;
            }

            // Check BdApi version and available modules
            const missingApis = [];
            if (!BdApi.Webpack) missingApis.push("Webpack");
            if (!BdApi.Patcher) missingApis.push("Patcher");
            if (!BdApi.Data) missingApis.push("Data");
            if (!BdApi.UI) missingApis.push("UI");

            if (missingApis.length > 0) {
                console.error(`[CustomThemePlugin] Missing required BdApi modules: ${missingApis.join(", ")}. Plugin may not function correctly.`);
            }

            // Reload the settings
            this.settings = this.loadSettings();

            // Initialize the plugin
            this.initialize();

            // Apply the current theme
            this.applyTheme();

            // Patch the appearance settings to add our custom theme option
            this.patchAppearanceSettings();
        } catch (error) {
            console.error("[CustomThemePlugin] Error in start method:", error);
        }
    }

    stop() {
        try {
            // Remove any elements we've added
            this.cleanup();
        } catch (error) {
            console.error("[CustomThemePlugin] Error in stop method:", error);
        }
    }

    initialize() {
        try {
            // We'll handle patching in the start method
            // No need to call patchAppearanceSettings here as it's already called in start()
            console.log("[CustomThemePlugin] Successfully initialized");
        } catch (error) {
            console.error("[CustomThemePlugin] Error in initialize method:", error);
        }
    }

    cleanup() {
        // Remove any elements we've added
        const customStyleElement = document.getElementById("custom-theme-styles");
        if (customStyleElement) customStyleElement.remove();

        // Remove any patches we've applied
        if (this.appearancePatch) this.appearancePatch();
    }

    patchAppearanceSettings() {
        // Check if BdApi is available
        if (!window.BdApi) {
            console.error("[CustomThemePlugin] BdApi is not available");
            return;
        }

        // Get the BetterDiscord API
        const {Patcher} = BdApi;

        // Check if BdApi.Webpack is available
        if (!BdApi.Webpack || !BdApi.Webpack.getModule) {
            console.error("[CustomThemePlugin] BdApi.Webpack.getModule is not available");
            return;
        }

        // Define a safe wrapper for getModule to handle potential errors
        const safeGetModule = (filter, options = {}) => {
            try {
                return BdApi.Webpack.getModule(filter, options);
            } catch (error) {
                console.error(`[CustomThemePlugin] Error in getModule:`, error);
                return null;
            }
        };

        // Find the appearance settings module using the safe wrapper
        let AppearanceSettings = safeGetModule(m =>
            m?.default?.displayName === "AppearanceSettings" ||
            (m?.default?.prototype?.render && m?.default?.prototype?.getPredicateSections)
            , {searchExports: true});

        // Try alternative methods if the first one fails
        if (!AppearanceSettings) {
            console.warn("[CustomThemePlugin] First attempt to find AppearanceSettings failed, trying alternatives...");

            // Try using BdApi.findModule if available
            if (BdApi.findModule) {
                try {
                    AppearanceSettings = BdApi.findModule(m =>
                        m?.default?.displayName === "AppearanceSettings" ||
                        (m?.default?.prototype?.render && m?.default?.prototype?.getPredicateSections)
                    );
                } catch (error) {
                    console.error("[CustomThemePlugin] Error using BdApi.findModule:", error);
                }
            }
        }

        if (!AppearanceSettings) {
            console.error("[CustomThemePlugin] Could not find AppearanceSettings module");
            return;
        }

        // Find the RadioGroup component using the safe wrapper
        let RadioGroup = safeGetModule(m => m?.RadioItem && m?.RadioGroup, {searchExports: true});

        // Try alternative methods if the first one fails
        if (!RadioGroup) {
            console.warn("[CustomThemePlugin] First attempt to find RadioGroup failed, trying alternatives...");

            // Try using BdApi.findModule if available
            if (BdApi.findModule) {
                try {
                    RadioGroup = BdApi.findModule(m => m?.RadioItem && m?.RadioGroup);
                } catch (error) {
                    console.error("[CustomThemePlugin] Error using BdApi.findModule for RadioGroup:", error);
                }
            }

            // Try a more generic approach if still not found
            if (!RadioGroup) {
                try {
                    RadioGroup = safeGetModule(m =>
                        m?.default?.displayName === "RadioGroup" ||
                        (m?.default && typeof m?.default === "function" && m?.default.toString().includes("radioSelection"))
                        , {searchExports: true});
                } catch (error) {
                    console.error("[CustomThemePlugin] Error in fallback RadioGroup search:", error);
                }
            }
        }

        if (!RadioGroup) {
            console.error("[CustomThemePlugin] Could not find RadioGroup component");
            return;
        }

        // Patch the appearance settings
        try {
            Patcher.after("CustomThemePlugin", AppearanceSettings, "default", (_, [props], returnValue) => {
                try {
                    // Find the theme section in the appearance settings
                    // ReactUtils is no longer needed for this approach
                    if (!returnValue || !returnValue.props || !returnValue.props.children) return;

                    // Find the theme section (the one with dark/light theme options)
                    // Check if BdApi.Utils exists before using it
                    if (!BdApi.Utils || !BdApi.Utils.findInTree) {
                        console.error("[CustomThemePlugin] BdApi.Utils.findInTree is not available");
                        return;
                    }

                    const themeSections = BdApi.Utils.findInTree(
                        returnValue,
                        n => {
                            // Check if this node has children that might contain radio options
                            if (!n?.props?.children?.props?.children) return false;

                            // Try to find radio group in children
                            const children = Array.isArray(n.props.children.props.children)
                                ? n.props.children.props.children
                                : [n.props.children.props.children];

                            return children.some(child =>
                                // Check for RadioGroup component or any radio input
                                child?.type?.RadioGroup ||
                                child?.props?.type === "radio" ||
                                (child?.props?.options && Array.isArray(child?.props?.options))
                            );
                        },
                        {walkable: ["props", "children"]}
                    );

                    if (!themeSections) return;

                    // Get the radio group for theme selection
                    const themeRadioGroup = themeSections.props.children?.props?.children?.find(child =>
                        child?.type === RadioGroup?.RadioGroup || (child?.props?.type === "radio" && Array.isArray(child?.props?.options))
                    );

                    if (!themeRadioGroup) return;

                    // Add our custom theme option
                    const originalOptions = themeRadioGroup.props.options;
                    const customThemeOption = {
                        name: "Custom Theme",
                        value: "custom",
                        desc: "Create and customize your own theme"
                    };

                    // Check if our option already exists
                    if (!originalOptions.find(opt => opt.value === "custom")) {
                        themeRadioGroup.props.options = [...originalOptions, customThemeOption];
                    }

                    // Handle selection of our custom theme
                    const originalOnChange = themeRadioGroup.props.onChange;
                    const self = this;
                    themeRadioGroup.props.onChange = (value) => {
                        if (value === "custom") {
                            // Open our settings panel using compatibility layer
                            self.BdApi.showSettingsModal("CustomThemePlugin", self.getSettingsPanel());
                            // Keep the previous theme selected in Discord's settings
                            return;
                        }
                        // Call the original handler for other themes
                        originalOnChange(value);
                    };
                } catch (error) {
                    console.error("[CustomThemePlugin] Error patching appearance settings:", error);
                }
            });
        } catch (error) {
            console.error("[CustomThemePlugin] Error applying patch to AppearanceSettings:", error);
        }
    }

    applyTheme() {
        // Apply the current theme settings
        try {
            let customStyleElement = document.getElementById("custom-theme-styles");

            if (!customStyleElement) {
                customStyleElement = document.createElement("style");
                customStyleElement.id = "custom-theme-styles";
                document.head.appendChild(customStyleElement);
                console.log("[CustomThemePlugin] Style element created");
            }

            const css = this.generateCSS();
            customStyleElement.textContent = css;
            this.styleElement = customStyleElement; // Store reference for later use
            console.log("[CustomThemePlugin] Theme applied successfully");
        } catch (error) {
            console.error("[CustomThemePlugin] Error in applyTheme method:", error);
        }
    }

    generateCSS() {
        // Generate CSS based on the current settings
        const colors = this.settings.colors;

        // Helper function to adjust color brightness
        const adjustColor = (color, percent) => {
            const num = parseInt(color.replace("#", ""), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;

            return "#" + (
                0x1000000 +
                (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
                (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
                (B < 255 ? (B < 0 ? 0 : B) : 255)
            ).toString(16).slice(1);
        };

        return `
            /* Custom Theme CSS Variables */
            :root {
                --custom-primary: ${colors.primary};
                --custom-secondary: ${colors.secondary};
                --custom-tertiary: ${colors.tertiary};
                --custom-accent: ${colors.accent};
                --custom-background: ${colors.background};
                --custom-text: ${colors.text};
            }

            /* Apply custom theme to Discord elements */
            .theme-dark, .theme-light {
                --background-primary: ${colors.background} !important;
                --background-secondary: ${colors.secondary} !important;
                --background-secondary-alt: ${colors.secondary} !important;
                --background-tertiary: ${colors.tertiary} !important;
                --background-accent: ${colors.accent} !important;
                --background-floating: ${colors.tertiary} !important;
                --text-normal: ${colors.text} !important;
                --text-muted: ${adjustColor(colors.text, -30)} !important;
                --header-primary: ${colors.text} !important;
                --header-secondary: ${adjustColor(colors.text, -30)} !important;
                --interactive-normal: ${colors.text} !important;
                --interactive-hover: ${colors.primary} !important;
                --interactive-active: ${colors.primary} !important;
                --interactive-muted: ${adjustColor(colors.text, -50)} !important;
                --channels-default: ${adjustColor(colors.text, -30)} !important;
                --brand-experiment: ${colors.primary} !important;
                --button-secondary-background: ${colors.secondary} !important;
                --button-secondary-background-hover: ${adjustColor(colors.secondary, 10)} !important;
                --button-secondary-background-active: ${adjustColor(colors.secondary, 20)} !important;
                --button-danger-background: #f04747 !important;
                --button-danger-background-hover: #f04747 !important;
                --button-danger-background-active: #f04747 !important;
                --scrollbar-thin-thumb: ${colors.secondary} !important;
                --scrollbar-thin-track: transparent !important;
                --scrollbar-auto-thumb: ${colors.secondary} !important;
                --scrollbar-auto-track: ${adjustColor(colors.background, -10)} !important;
                --channeltextarea-background: ${adjustColor(colors.background, 5)} !important;
                --activity-card-background: ${colors.secondary} !important;
                --deprecated-card-bg: ${colors.secondary} !important;
                --deprecated-card-editable-bg: ${adjustColor(colors.secondary, 5)} !important;
                --deprecated-text-input-bg: ${colors.background} !important;
                --deprecated-text-input-border: ${colors.tertiary} !important;
                --deprecated-text-input-border-hover: ${colors.primary} !important;
                --deprecated-text-input-prefix: ${colors.accent} !important;
            }

            /* Style specific Discord elements */
            .sidebar-2K8pFh {
                background-color: ${colors.tertiary} !important;
            }

            .container-3w7J-x, .panels-j1Uci_ {
                background-color: ${colors.tertiary} !important;
            }

            .members-1998pB {
                background-color: ${colors.tertiary} !important;
            }

            .chat-3bRxxu {
                background-color: ${colors.background} !important;
            }

            .channelTextArea-rNsIhG {
                background-color: ${adjustColor(colors.background, 5)} !important;
            }

            .button-1YfofB.buttonColor-7qQbGO {
                background-color: ${colors.primary} !important;
                color: white !important;
            }

            /* Custom CSS added by the user */
            ${this.settings.customCSS}
        `;
    }

    getSettingsPanel() {
        // Create settings panel
        const panel = document.createElement("div");
        panel.className = "custom-theme-settings";

        // Add title
        const title = document.createElement("h2");
        title.textContent = "Custom Theme Settings";
        panel.appendChild(title);

        // Add color pickers
        const colorSection = document.createElement("div");
        colorSection.className = "color-picker-section";

        // Add styles for the settings panel
        const style = document.createElement("style");
        style.textContent = `
            .custom-theme-settings {
                padding: 10px;
            }
            .color-picker-section {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            .color-picker-item {
                display: flex;
                flex-direction: column;
            }
            .color-picker-label {
                margin-bottom: 5px;
                font-weight: 500;
            }
            .color-preview {
                width: 100%;
                height: 40px;
                border-radius: 3px;
                margin-bottom: 5px;
                border: 1px solid var(--background-tertiary);
            }
            .theme-preview {
                background-color: var(--background-primary);
                border-radius: 5px;
                padding: 15px;
                margin-top: 20px;
                border: 1px solid var(--background-tertiary);
            }
            .preview-header {
                background-color: var(--background-secondary);
                padding: 10px;
                border-radius: 3px;
                margin-bottom: 10px;
            }
            .preview-content {
                display: flex;
                gap: 10px;
            }
            .preview-sidebar {
                background-color: var(--background-secondary);
                width: 80px;
                border-radius: 3px;
                padding: 10px;
            }
            .preview-main {
                background-color: var(--background-tertiary);
                flex: 1;
                border-radius: 3px;
                padding: 10px;
            }
            .preview-button {
                background-color: var(--custom-primary);
                color: white;
                border: none;
                border-radius: 3px;
                padding: 8px 16px;
                margin-top: 10px;
                cursor: pointer;
            }
            .custom-css-textarea {
                width: 100%;
                height: 100px;
                background-color: var(--background-tertiary);
                color: var(--text-normal);
                border: 1px solid var(--background-tertiary);
                border-radius: 3px;
                padding: 8px;
                margin-top: 5px;
                resize: vertical;
            }
        `;
        panel.appendChild(style);

        // Create color pickers for each color
        const colorKeys = Object.keys(this.settings.colors);
        colorKeys.forEach(colorKey => {
            const colorItem = document.createElement("div");
            colorItem.className = "color-picker-item";

            const label = document.createElement("div");
            label.className = "color-picker-label";
            label.textContent = colorKey.charAt(0).toUpperCase() + colorKey.slice(1);

            const preview = document.createElement("div");
            preview.className = "color-preview";
            preview.style.backgroundColor = this.settings.colors[colorKey];

            const picker = document.createElement("input");
            picker.type = "color";
            picker.value = this.settings.colors[colorKey];
            picker.addEventListener("input", () => {
                this.settings.colors[colorKey] = picker.value;
                preview.style.backgroundColor = picker.value;
                this.saveSettings();
                this.applyTheme();
                this.updatePreview();
            });

            colorItem.appendChild(label);
            colorItem.appendChild(preview);
            colorItem.appendChild(picker);
            colorSection.appendChild(colorItem);
        });

        panel.appendChild(colorSection);

        // Add custom CSS textarea
        const customCSSSection = document.createElement("div");
        customCSSSection.className = "custom-css-section";

        const customCSSLabel = document.createElement("div");
        customCSSLabel.className = "color-picker-label";
        customCSSLabel.textContent = "Custom CSS";

        const customCSSTextarea = document.createElement("textarea");
        customCSSTextarea.className = "custom-css-textarea";
        customCSSTextarea.value = this.settings.customCSS;
        customCSSTextarea.addEventListener("input", () => {
            this.settings.customCSS = customCSSTextarea.value;
            this.saveSettings();
            this.applyTheme();
        });

        customCSSSection.appendChild(customCSSLabel);
        customCSSSection.appendChild(customCSSTextarea);
        panel.appendChild(customCSSSection);

        // Add theme preview
        const previewSection = document.createElement("div");
        previewSection.className = "theme-preview";
        previewSection.innerHTML = `
            <div class="preview-header">Theme Preview</div>
            <div class="preview-content">
                <div class="preview-sidebar"></div>
                <div class="preview-main">
                    <div>This is a preview of your custom theme</div>
                    <button class="preview-button">Button</button>
                </div>
            </div>
        `;
        panel.appendChild(previewSection);

        // Save reference to preview elements for updating
        this.previewSection = previewSection;
        this.updatePreview();

        // Add reset button
        const resetButton = document.createElement("button");
        resetButton.className = "preview-button";
        resetButton.style.marginTop = "20px";
        resetButton.textContent = "Reset to Default";
        resetButton.addEventListener("click", () => {
            this.settings.colors = {...this.defaultSettings.colors};
            this.settings.customCSS = this.defaultSettings.customCSS;
            this.saveSettings();
            this.applyTheme();

            // Update color pickers
            const colorInputs = panel.querySelectorAll("input[type=color]");
            const colorPreviews = panel.querySelectorAll(".color-preview");
            colorKeys.forEach((key, index) => {
                colorInputs[index].value = this.settings.colors[key];
                colorPreviews[index].style.backgroundColor = this.settings.colors[key];
            });

            // Update custom CSS textarea
            customCSSTextarea.value = this.settings.customCSS;

            // Update preview
            this.updatePreview();
        });
        panel.appendChild(resetButton);

        return panel;
    }

    updatePreview() {
        if (!this.previewSection) return;

        const colors = this.settings.colors;
        const previewHeader = this.previewSection.querySelector(".preview-header");
        const previewSidebar = this.previewSection.querySelector(".preview-sidebar");
        const previewMain = this.previewSection.querySelector(".preview-main");
        const previewButton = this.previewSection.querySelector(".preview-button");

        this.previewSection.style.backgroundColor = colors.background;
        this.previewSection.style.color = colors.text;

        if (previewHeader) previewHeader.style.backgroundColor = colors.tertiary;
        if (previewSidebar) previewSidebar.style.backgroundColor = colors.tertiary;
        if (previewMain) previewMain.style.backgroundColor = colors.secondary;
        if (previewButton) {
            previewButton.style.backgroundColor = colors.primary;
            previewButton.style.color = "#ffffff";
        }
    }

    saveSettings() {
        try {
            // Use compatibility layer to save settings
            this.BdApi.saveData(this.getName(), "settings", this.settings);
        } catch (error) {
            console.error("[CustomThemePlugin] Error saving settings:", error);
        }
    }

    loadSettings() {
        try {
            // Use compatibility layer to load settings
            const loadedSettings = this.BdApi.getData(this.getName(), "settings");
            if (loadedSettings) {
                // Merge loaded settings with default settings to ensure all properties exist
                return {
                    ...this.defaultSettings,
                    ...loadedSettings,
                    // Ensure all color properties exist
                    colors: {
                        ...this.defaultSettings.colors,
                        ...(loadedSettings.colors || {})
                    }
                };
            }
            console.log(`${this.getName()}: No saved settings found, using defaults`);
        } catch (error) {
            console.error("[CustomThemePlugin] Error loading settings:", error);
        }

        // Use default settings if loading fails or none are saved
        return {...this.defaultSettings};
    }
};
