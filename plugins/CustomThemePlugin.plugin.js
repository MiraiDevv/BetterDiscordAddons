/**
 * @name CustomThemePlugin
 * @version 1.0.0
 * @description Adds a custom theme feature to Discord with live preview and customization
 * @author MiraiDevv
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
    getAuthor() {return "MiraiDevv";}

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
        const intensity = typeof this.settings.intensity === 'number' ? this.settings.intensity : 74;
        const opacity = Math.max(0, Math.min(1, intensity / 100));

        // Helper: hex to rgba
        function hexToRgba(hex, alpha = 1) {
            let c = hex.replace('#', '');
            if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
            const num = parseInt(c, 16);
            return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
        }
        // Helper function to adjust color brightness
        const adjustColor = (color, percent, alpha = opacity) => {
            const num = parseInt(color.replace("#", ""), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return `rgba(${R < 255 ? (R < 0 ? 0 : R) : 255},${G < 255 ? (G < 0 ? 0 : G) : 255},${B < 255 ? (B < 0 ? 0 : B) : 255},${alpha})`;
        };

        // Usar a escala tonal para variáveis CSS --custom-50 ... --custom-900
        const scale = colors.scale || {};
        const isLight = (this.settings.mode === 'light');
        const alphaForBackgrounds = isLight ? 1 : opacity;
        const scaleVars = [];
        [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].forEach(k => {
            const v = scale[k] ? scale[k] : 'transparent';
            scaleVars.push(`--custom-${k}: ${v};`);
        });

        // Forçar opacidade total para fundo/texto no modo light
        const bgOpaque = hexToRgba(colors.background, 1);
        // Para texto, garantir contraste: preto no light, branco no dark
        const textOpaque = isLight ? '#23272A' : hexToRgba(colors.text, 1);

        // Cores de texto para contraste em modo light
        const textMuted = isLight ? '#4F5660' : adjustColor(colors.text, -30, alphaForBackgrounds);
        const headerPrimary = isLight ? '#23272A' : textOpaque;
        const headerSecondary = isLight ? '#4F5660' : adjustColor(colors.text, -30, alphaForBackgrounds);
        const interactiveNormal = isLight ? '#23272A' : textOpaque;
        const channelsDefault = isLight ? '#4F5660' : adjustColor(colors.text, -30, alphaForBackgrounds);

        // Botões: texto escuro no light, branco no dark
        const buttonText = isLight ? '#23272A' : '#fff';

        return `
            /* Custom Theme CSS Variables */
            :root {
                --custom-primary: ${hexToRgba(colors.primary, opacity)};
                --custom-secondary: ${hexToRgba(colors.secondary, alphaForBackgrounds)};
                --custom-tertiary: ${hexToRgba(colors.tertiary, alphaForBackgrounds)};
                --custom-accent: ${hexToRgba(colors.accent, alphaForBackgrounds)};
                --custom-background: ${bgOpaque};
                --custom-text: ${textOpaque};
                ${scaleVars.join('\n                ')}
                --darkplus-bg: ${hexToRgba(colors.tertiary, 1)};
                --darkplus-bg2: ${hexToRgba(colors.secondary, 1)};
                --darkplus-sec: ${hexToRgba(colors.primary, 1)};
                --darkplus-links: ${hexToRgba(colors.accent, 1)};
            }

            .theme-dark, .theme-light {
                --background-primary: var(--custom-900) !important;
                --background-secondary: var(--custom-700) !important;
                --background-secondary-alt: var(--custom-600) !important;
                --background-tertiary: var(--custom-500) !important;
                --background-accent: var(--custom-400) !important;
                --background-floating: var(--custom-300) !important;
                --text-normal: ${textOpaque} !important;
                --text-muted: ${textMuted} !important;
                --header-primary: ${headerPrimary} !important;
                --header-secondary: ${headerSecondary} !important;
                --interactive-normal: ${interactiveNormal} !important;
                --interactive-hover: var(--custom-200) !important;
                --interactive-active: var(--custom-100) !important;
                --interactive-muted: ${isLight ? '#C7CCD1' : adjustColor(colors.text, -50, alphaForBackgrounds)} !important;
                --channels-default: ${channelsDefault} !important;
                --brand-experiment: var(--custom-500) !important;
                --button-secondary-background: var(--custom-600) !important;
                --button-secondary-background-hover: var(--custom-500) !important;
                --button-secondary-background-active: var(--custom-400) !important;
                --button-danger-background: rgba(240,71,71,${alphaForBackgrounds}) !important;
                --button-danger-background-hover: rgba(240,71,71,${alphaForBackgrounds}) !important;
                --button-danger-background-active: rgba(240,71,71,${alphaForBackgrounds}) !important;
                --scrollbar-thin-thumb: var(--custom-700) !important;
                --scrollbar-thin-track: transparent !important;
                --scrollbar-auto-thumb: var(--custom-700) !important;
                --scrollbar-auto-track: var(--custom-900) !important;
                --channeltextarea-background: var(--custom-800) !important;
                --activity-card-background: var(--custom-600) !important;
                --deprecated-card-bg: var(--custom-600) !important;
                --deprecated-card-editable-bg: var(--custom-500) !important;
                --deprecated-text-input-bg: var(--custom-800) !important;
                --deprecated-text-input-border: var(--custom-700) !important;
                --deprecated-text-input-border-hover: var(--custom-500) !important;
                --deprecated-text-input-prefix: var(--custom-400) !important;
            }

            /* Ajuste de cor do texto dos botões para modo light */
            .theme-light .button-1YfofB.buttonColor-7qQbGO {
                color: #23272A !important;
            }
            .theme-dark .button-1YfofB.buttonColor-7qQbGO {
                color: #fff !important;
            }

            /* Style specific Discord elements and dynamic classes */
            [class*="sidebar"], [class*="container"], [class*="chat"], [class*="members"], [class*="panels"], [class*="content"], [class*="toolbar"], [class*="title"], [class*="modal"], [class*="menu"], [class*="popout"], [class*="contextMenu"], [class*="input"], [class*="searchBar"], [class*="button"], [class*="checkbox"], [class*="radio"], [class*="slider"], [class*="bar"], [class*="root"], [class*="header"] {
                transition: background 0.2s, color 0.2s, border-color 0.2s;
            }
            [class*="sidebar"] {
                background-color: var(--custom-800) !important;
            }
            [class*="container"] {
                background-color: var(--custom-700) !important;
            }
            [class*="members"] {
                background-color: var(--custom-700) !important;
            }
            [class*="chat"] {
                background-color: var(--custom-900) !important;
            }
            [class*="channelTextArea"] {
                background-color: var(--custom-800) !important;
            }
            [class*="button"] {
                background-color: var(--custom-500) !important;
                color: ${buttonText} !important;
                border-color: var(--custom-700) !important;
            }
            [class*="button"]:hover {
                background-color: var(--custom-400) !important;
            }
            [class*="button"]:active {
                background-color: var(--custom-300) !important;
            }
            [class*="checkbox"][aria-checked="true"] [class*="checkboxInner"] {
                background-color: var(--custom-500) !important;
                border-color: var(--custom-500) !important;
            }
            [class*="radioSelection"][aria-checked="true"] {
                background-color: var(--custom-500) !important;
                border-color: var(--custom-500) !important;
            }
            [class*="slider"] [class*="bar"] {
                background: var(--custom-700) !important;
            }
            [class*="slider"] [class*="barFill"] {
                background: var(--custom-500) !important;
            }

            /* Inputs, selects, popouts, menus, modals, tooltips, headers, etc */
            input, textarea, select, [class*="inputDefault"], [class*="input-"], [class*="searchBar"], [class*="searchBarComponent"] {
                background-color: var(--custom-800) !important;
                color: ${textOpaque} !important;
                border-color: var(--custom-500) !important;
            }
            [class*="menu"], [class*="contextMenu"], [class*="popout"] {
                background-color: var(--custom-700) !important;
                color: ${textOpaque} !important;
            }
            [class*="modal"], [class*="root"] {
                background-color: var(--custom-900) !important;
                color: ${textOpaque} !important;
            }
            [class*="header"], [class*="title"], [class*="modalTitle"] {
                color: ${headerPrimary} !important;
            }

            /* Custom CSS added by the user */
            ${this.settings.customCSS}
        `;
    }

    getSettingsPanel() {
        // Modern Discord-like settings panel
        const panel = document.createElement("div");
        panel.className = "custom-theme-settings modern-theme-panel discord-modern-panel";

        // Add styles for the modern panel
        const style = document.createElement("style");
        style.textContent = `
            .discord-modern-panel {
                font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
                background: var(--background-primary);
                border-radius: 16px;
                box-shadow: 0 2px 16px 0 rgba(0,0,0,0.08);
                padding: 0 0 0 0;
                max-width: 420px;
                margin: 0 auto;
                color: var(--text-normal);
                display: flex;
                flex-direction: column;
                min-height: 600px;
            }
            .modern-theme-header {
                font-size: 1.15rem;
                font-weight: 700;
                padding: 24px 24px 0 24px;
                margin-bottom: 0;
                letter-spacing: -0.5px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .modern-theme-header .icon-eye {
                font-size: 1.1em;
                opacity: 0.7;
            }
            .modern-theme-section {
                padding: 0 24px;
                margin-bottom: 0;
            }
            .appearance-toggle {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 18px 0 18px 0;
            }
            .appearance-switch {
                background: #e3e6f0;
                border-radius: 12px;
                display: flex;
                align-items: center;
                padding: 2px 4px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .appearance-switch span {
                padding: 4px 12px;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 500;
                color: #5865f2;
                background: #fff;
                margin: 0 2px;
                transition: background 0.2s, color 0.2s;
            }
            .appearance-switch .active {
                background: #5865f2;
                color: #fff;
            }
            .color-picker-section {
                margin-bottom: 0;
            }
            .color-bar {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            .color-bar-btn {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                border: 2px solid transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: border 0.2s;
                position: relative;
                background: none;
            }
            .color-bar-btn.selected {
                border: 2px solid #5865f2;
            }
            .color-bar-dot {
                width: 20px;
                height: 20px;
                border-radius: 6px;
                background: currentColor;
                border: 1.5px solid #fff;
                box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
            }
            .color-bar-btn.add {
                background: #f2f3f5;
                color: #5865f2;
                border: 2px dashed #b9bbbe;
            }
            .color-bar-btn.add .plus {
                font-size: 1.2em;
                font-weight: 700;
            }
            .color-picker-canvas {
                width: 100%;
                max-width: 320px;
                height: 120px;
                border-radius: 12px;
                margin: 0 auto 8px auto;
                display: block;
                cursor: crosshair;
                background: #fff;
                box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
            }
            .hue-slider {
                width: 100%;
                max-width: 320px;
                margin: 0 auto 8px auto;
                display: block;
            }
            .hex-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            .hex-label {
                font-size: 0.98rem;
                font-weight: 500;
            }
            .hex-input {
                width: 90px;
                font-size: 1rem;
                border-radius: 6px;
                border: 1px solid #e3e6f0;
                padding: 4px 8px;
                background: var(--background-tertiary);
                color: var(--text-normal);
            }
            .color-controls-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            .intensity-row {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 18px;
            }
            .intensity-label {
                font-size: 0.98rem;
                font-weight: 500;
                min-width: 110px;
            }
            .intensity-slider {
                flex: 1;
            }
            .modern-btn, .modern-btn-secondary {
                border: none;
                border-radius: 8px;
                padding: 10px 18px;
                font-size: 1rem;
                font-weight: 600;
                background: #5865f2;
                color: #fff;
                margin-right: 10px;
                margin-top: 8px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .modern-btn-secondary {
                background: #f2f3f5;
                color: #5865f2;
                border: 1px solid #e3e6f0;
            }
            .modern-btn:active, .modern-btn-secondary:active {
                filter: brightness(0.95);
            }
            .modern-btn.reset {
                background: #f2f3f5;
                color: #f04747;
                border: 1px solid #e3e6f0;
            }
            .modern-btn.surprise {
                background: #f2f3f5;
                color: #43b581;
                border: 1px solid #e3e6f0;
            }
            .custom-css-section {
                margin-bottom: 18px;
            }
            .custom-css-label {
                font-size: 1rem;
                font-weight: 500;
                margin-bottom: 4px;
            }
            .custom-css-textarea {
                width: 100%;
                height: 80px;
                background: var(--background-tertiary);
                color: var(--text-normal);
                border: 1px solid #e3e6f0;
                border-radius: 8px;
                padding: 8px;
                font-size: 0.98rem;
                resize: vertical;
            }
            .theme-preview {
                background: var(--background-primary);
                border-radius: 12px;
                padding: 18px;
                margin-top: 18px;
                border: 1px solid #e3e6f0;
                box-shadow: 0 1px 8px 0 rgba(0,0,0,0.04);
            }
            .footer-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 18px 24px 18px 24px;
                border-top: 1px solid #e3e6f0;
                margin-top: 18px;
            }
            .footer-row .modern-btn {
                margin: 0;
            }
        `;
        panel.appendChild(style);

        // Header
        const header = document.createElement("div");
        header.className = "modern-theme-header";
        header.innerHTML = `<span>Customize your theme <span class='icon-eye'>👁️</span></span>`;
        panel.appendChild(header);

        // Appearance toggle
        const appearanceRow = document.createElement("div");
        appearanceRow.className = "appearance-toggle modern-theme-section";
        const switchLabel = document.createElement("label");
        switchLabel.textContent = "Appearance";
        const switchDiv = document.createElement("div");
        switchDiv.className = "appearance-switch";
        const darkBtn = document.createElement("span");
        darkBtn.textContent = "🌙";
        const lightBtn = document.createElement("span");
        lightBtn.textContent = "☀️";
        let currentMode = (this.settings.mode === 'light') ? 'light' : 'dark';
        function setActiveMode(mode) {
            if (mode === 'dark') {
                darkBtn.className = 'active';
                lightBtn.className = '';
            } else {
                darkBtn.className = '';
                lightBtn.className = 'active';
            }
        }
        setActiveMode(currentMode);
        const setThemePalette = (mode) => {
            // preserve baseColor; if not set use existing primary
            if (!this.settings.baseColor) this.settings.baseColor = this.settings.colors.primary || this.defaultSettings.colors.primary;
            // compute palette from base color depending on mode and intensity
            this.settings.mode = mode;
            this.settings.colors = this.computePalette(this.settings.baseColor, mode, this.settings.intensity);
            setActiveMode(mode);
            this.saveSettings();
            this.applyTheme();
            this.updatePreview();
            updateColorBarUI();
        };
        darkBtn.onclick = () => setThemePalette('dark');
        lightBtn.onclick = () => setThemePalette('light');
        switchDiv.appendChild(darkBtn);
        switchDiv.appendChild(lightBtn);
        appearanceRow.appendChild(switchLabel);
        appearanceRow.appendChild(switchDiv);
        panel.appendChild(appearanceRow);

        // Color section
        const colorSection = document.createElement("div");
        colorSection.className = "color-picker-section modern-theme-section";
        const colorTitle = document.createElement("div");
        colorTitle.style.fontWeight = "600";
        colorTitle.style.marginBottom = "8px";
        colorTitle.textContent = "Colors";
        colorSection.appendChild(colorTitle);

        // Color properties
        // For light mode we only show a single base color; for dark mode we show full properties
        let colorProps = [
            {key: 'primary', label: 'Primary'},
            {key: 'secondary', label: 'Secondary'},
            {key: 'tertiary', label: 'Tertiary'},
            {key: 'accent', label: 'Accent'},
            {key: 'background', label: 'Background'},
            {key: 'text', label: 'Text'}
        ];
        // Always use a single base color UI for both modes
        let selectedProp = 'base';
        // Keep a single base color state
        if (!this.settings.baseColor) this.settings.baseColor = this.settings.colors.primary || this.defaultSettings.colors.primary;

        // Color bar (horizontal, Discord style)
        const colorBar = document.createElement("div");
        colorBar.className = "color-bar";
        function updateColorBarUI() {
            colorBar.innerHTML = '';
            // Always show only the base color chip (single color-driven palette)
            const showingProps = [{key: 'base', label: 'Base'}];
            showingProps.forEach((prop, idx) => {
                const btn = document.createElement("button");
                btn.className = "color-bar-btn" + (selectedProp === prop.key ? " selected" : "");
                btn.title = prop.label;
                const colorVal = (prop.key === 'base') ? this.settings.baseColor : this.settings.colors[prop.key];
                btn.style.color = colorVal;
                btn.innerHTML = `<span class='color-bar-dot'></span>`;
                btn.onclick = () => {
                    selectedProp = prop.key;
                    updateColorBarUI();
                    updateColorPickerUI();
                };
                colorBar.appendChild(btn);
            });
            // Add color button (not functional, just for UI)
            const addBtn = document.createElement("button");
            addBtn.className = "color-bar-btn add";
            addBtn.title = "Add Color";
            addBtn.innerHTML = `<span class='plus'>+</span>`;
            addBtn.onclick = () => {
                // No-op, just for UI
            };
            colorBar.appendChild(addBtn);
        }
        updateColorBarUI = updateColorBarUI.bind(this);
        updateColorBarUI();
        colorSection.appendChild(colorBar);

        // Color picker canvas (2D gradient)
        const colorPickerCanvas = document.createElement("canvas");
        colorPickerCanvas.className = "color-picker-canvas";
        colorPickerCanvas.width = 320;
        colorPickerCanvas.height = 120;
        colorSection.appendChild(colorPickerCanvas);

        // Hue slider
        const hueSlider = document.createElement("input");
        hueSlider.type = "range";
        hueSlider.className = "hue-slider";
        hueSlider.min = 0;
        hueSlider.max = 360;
        hueSlider.value = 240;
        // Custom hue slider background (rainbow gradient)
        hueSlider.style.background =
            'linear-gradient(to right,' +
            Array.from({length: 7}, (_, i) => `hsl(${i * 60},100%,50%)`).join(',') +
            ')';
        // Custom thumb color (updates on input)
        function updateHueThumb() {
            const h = parseInt(hueSlider.value, 10);
            const color = `hsl(${h},100%,50%)`;
            hueSlider.style.setProperty('--hue-thumb', color);
        }
        hueSlider.addEventListener('input', updateHueThumb);
        // Initial thumb color
        updateHueThumb();
        // Add custom CSS for thumb
        style.textContent += `
            .hue-slider {
                appearance: none;
                -webkit-appearance: none;
                height: 12px;
                border-radius: 6px;
                outline: none;
                margin-bottom: 8px;
                background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red);
            }
            .hue-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 2px solid #fff;
                box-shadow: 0 1px 4px 0 rgba(0,0,0,0.10);
                background: var(--hue-thumb, #fff);
                cursor: pointer;
                transition: background 0.2s;
            }
            .hue-slider::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 2px solid #fff;
                box-shadow: 0 1px 4px 0 rgba(0,0,0,0.10);
                background: var(--hue-thumb, #fff);
                cursor: pointer;
                transition: background 0.2s;
            }
            .hue-slider::-ms-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 2px solid #fff;
                box-shadow: 0 1px 4px 0 rgba(0,0,0,0.10);
                background: var(--hue-thumb, #fff);
                cursor: pointer;
                transition: background 0.2s;
            }
            .hue-slider:focus {
                outline: none;
            }
        `;
        colorSection.appendChild(hueSlider);

        // HEX row
        const hexRow = document.createElement("div");
        hexRow.className = "hex-row";
        const hexLabel = document.createElement("span");
        hexLabel.className = "hex-label";
        hexLabel.textContent = "HEX";
        const hexInput = document.createElement("input");
        hexInput.type = "text";
        hexInput.maxLength = 7;
        hexInput.className = "hex-input";
        // initialize hex input from baseColor by default
        hexInput.value = (selectedProp === 'base') ? (this.settings.baseColor || this.settings.colors.primary) : this.settings.colors[selectedProp];
        hexRow.appendChild(hexLabel);
        hexRow.appendChild(hexInput);
        colorSection.appendChild(hexRow);

        // Color picker logic (canvas + hue)
        function hexToRgb(hex) {
            let c = hex.replace('#', '');
            if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
            const num = parseInt(c, 16);
            return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
        }
        function rgbToHex(r, g, b) {
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
        }
        function hsvToRgb(h, s, v) {
            let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
            return [f(5), f(3), f(1)].map(x => Math.round(x * 255));
        }
        function rgbToHsv(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            let max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, v = max;
            let d = max - min;
            s = max === 0 ? 0 : d / max;
            if (max === min) h = 0;
            else {
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h *= 60;
            }
            return [h, s, v];
        }
        function drawColorPicker(hue) {
            const ctx = colorPickerCanvas.getContext('2d');
            for (let x = 0; x < colorPickerCanvas.width; x++) {
                for (let y = 0; y < colorPickerCanvas.height; y++) {
                    let s = x / colorPickerCanvas.width;
                    let v = 1 - y / colorPickerCanvas.height;
                    let [r, g, b] = hsvToRgb(hue, s, v);
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        function updateColorPickerUI() {
            // choose the color source: baseColor in light mode or individual color in dark
            const sourceHex = (selectedProp === 'base') ? this.settings.baseColor : this.settings.colors[selectedProp];
            // Get HSV from selected color
            let rgb = hexToRgb(sourceHex);
            let [h, s, v] = rgbToHsv(...rgb);
            hueSlider.value = Math.round(h);
            drawColorPicker(h);
            hexInput.value = sourceHex;
            updateColorBarUI();
        }
        updateColorPickerUI = updateColorPickerUI.bind(this);
        updateColorPickerUI();

        // Canvas click to pick color
        colorPickerCanvas.addEventListener('click', (e) => {
            const rect = colorPickerCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            let s = x / colorPickerCanvas.width;
            let v = 1 - y / colorPickerCanvas.height;
            let h = parseInt(hueSlider.value, 10);
            let [r, g, b] = hsvToRgb(h, s, v);
            const hex = rgbToHex(r, g, b);
            if (selectedProp === 'base') {
                this.settings.baseColor = hex;
                // compute palette and write into settings.colors
                this.settings.colors = this.computePalette(this.settings.baseColor, this.settings.mode, this.settings.intensity);
            } else {
                this.settings.colors[selectedProp] = hex;
            }
            hexInput.value = hex;
            this.saveSettings();
            this.applyTheme();
            this.updatePreview();
            updateColorPickerUI();
        });
        // Hue slider
        hueSlider.addEventListener('input', () => {
            drawColorPicker(parseInt(hueSlider.value, 10));
        });
        // HEX input
        hexInput.addEventListener('input', () => {
            let val = hexInput.value;
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                val = val.toUpperCase();
                if (selectedProp === 'base') {
                    this.settings.baseColor = val;
                    this.settings.colors = this.computePalette(this.settings.baseColor, this.settings.mode, this.settings.intensity);
                } else {
                    this.settings.colors[selectedProp] = val;
                }
                this.saveSettings();
                this.applyTheme();
                this.updatePreview();
                updateColorPickerUI();
            }
        });

        // Controls row (Surprise Me, Reset)
        const controlsRow = document.createElement("div");
        controlsRow.className = "color-controls-row";
        // Surprise Me
        const surpriseBtn = document.createElement("button");
        surpriseBtn.className = "modern-btn-secondary surprise";
        surpriseBtn.textContent = "Surprise Me!";
        surpriseBtn.addEventListener("click", () => {
            // pick a random base color and compute palette
            const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`;
            this.settings.baseColor = randomColor;
            this.settings.colors = this.computePalette(this.settings.baseColor, this.settings.mode, this.settings.intensity);
            this.saveSettings();
            this.applyTheme();
            this.updatePreview();
            updateColorPickerUI();
        });
        // Reset
        const resetBtn = document.createElement("button");
        resetBtn.className = "modern-btn-secondary reset";
        resetBtn.textContent = "Reset";
        resetBtn.addEventListener("click", () => {
            // reset baseColor to default primary and compute palette
            this.settings.baseColor = this.defaultSettings.colors.primary;
            this.settings.colors = this.computePalette(this.settings.baseColor, this.settings.mode, this.settings.intensity);
            this.settings.customCSS = this.defaultSettings.customCSS;
            this.saveSettings();
            this.applyTheme();
            updateColorPickerUI();
            customCSSTextarea.value = this.settings.customCSS;
            this.updatePreview();
        });
        controlsRow.appendChild(surpriseBtn);
        controlsRow.appendChild(resetBtn);
        colorSection.appendChild(controlsRow);

        // Intensity row
        const intensityRow = document.createElement("div");
        intensityRow.className = "intensity-row";
        const intensityLabel = document.createElement("div");
        intensityLabel.className = "intensity-label";
        intensityLabel.textContent = "Color Intensity";
        const intensitySlider = document.createElement("input");
        intensitySlider.type = "range";
        intensitySlider.className = "intensity-slider";
        intensitySlider.min = 0;
        intensitySlider.max = 100;
        intensitySlider.value = this.settings.intensity || 74;
        const intensityValue = document.createElement("span");
        intensityValue.textContent = `${intensitySlider.value}%`;
        intensitySlider.addEventListener("input", () => {
            intensityValue.textContent = `${intensitySlider.value}%`;
            this.settings.intensity = parseInt(intensitySlider.value, 10);
            // recompute palette from baseColor so intensity takes effect
            if (this.settings.baseColor) this.settings.colors = this.computePalette(this.settings.baseColor, this.settings.mode, this.settings.intensity);
            this.saveSettings();
            this.applyTheme();
            this.updatePreview();
        });
        intensityRow.appendChild(intensityLabel);
        intensityRow.appendChild(intensitySlider);
        intensityRow.appendChild(intensityValue);
        colorSection.appendChild(intensityRow);

        panel.appendChild(colorSection);

        // Custom CSS section
        const customCSSSection = document.createElement("div");
        customCSSSection.className = "custom-css-section modern-theme-section";
        const customCSSLabel = document.createElement("div");
        customCSSLabel.className = "custom-css-label";
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

        // Preview do tema
        const previewSection = document.createElement("div");
        previewSection.className = "theme-preview modern-theme-section";
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
        // Ensure palette is computed from baseColor on first open
        if (this.settings.baseColor) {
            this.settings.colors = this.computePalette(this.settings.baseColor, this.settings.mode || 'dark', this.settings.intensity);
        }
        this.previewSection = previewSection;
        this.updatePreview();

        // Footer row (Back, Apply)
        const footerRow = document.createElement("div");
        footerRow.className = "footer-row";
        // Back button (just closes modal)
        const backBtn = document.createElement("button");
        backBtn.className = "modern-btn-secondary";
        backBtn.textContent = "Back";
        backBtn.onclick = () => {
            // Try to close modal (works in BD)
            const modal = panel.closest('.bd-modal-inner, .bd-modal');
            if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
        };
        // Apply button
        const applyBtn = document.createElement("button");
        applyBtn.className = "modern-btn";
        applyBtn.textContent = "Apply";
        applyBtn.onclick = () => {
            this.saveSettings();
            this.applyTheme();
            this.updatePreview();
        };
        footerRow.appendChild(backBtn);
        footerRow.appendChild(applyBtn);
        panel.appendChild(footerRow);

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

    // Compute a matching palette from a single base color depending on mode and intensity
    computePalette(baseHex, mode = 'dark', intensity = 74) {
        // Helpers
        const hexToRgb = (hex) => {
            let c = hex.replace('#', '');
            if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
            const num = parseInt(c, 16);
            return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
        };
        const rgbToHex = (r, g, b) => {
            return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('').toUpperCase();
        };
        const rgbToHsl = (r, g, b) => {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            if (max === min) {h = s = 0;}
            else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return [h * 360, s, l];
        };
        const hslToRgb = (h, s, l) => {
            h /= 360;
            let r, g, b;
            if (s === 0) r = g = b = l;
            else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        };
        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

        // parse base
        try {
            const [r, g, b] = hexToRgb(baseHex || this.defaultSettings.colors.primary);
            let [h, s, l] = rgbToHsl(r, g, b);

            // intensity influences how subtle or aggressive the derived tones are
            const intensityFactor = clamp((intensity || 74) / 100, 0.05, 1);
            const delta = Math.round(18 * (1 - intensityFactor));

            let primary = baseHex.toUpperCase();
            let secondary, tertiary, accent, background, text;
            // Generate tonal scale (Tailwind-like) from base HSL
            const makeTone = (h, s, l) => (hh, ss, ll) => rgbToHex(...hslToRgb(hh ?? h, ss ?? s, ll ?? l));
            const toneGenerator = makeTone(h, s, l);
            const scale = {};
            // target lightness stops roughly corresponding to Tailwind 50..900
            const lightnessMap = {
                50: clamp(l + 0.50, 0, 1),
                100: clamp(l + 0.36, 0, 1),
                200: clamp(l + 0.20, 0, 1),
                300: clamp(l + 0.08, 0, 1),
                400: clamp(l - 0.02, 0, 1),
                500: clamp(l - 0.10, 0, 1),
                600: clamp(l - 0.20, 0, 1),
                700: clamp(l - 0.34, 0, 1),
                800: clamp(l - 0.48, 0, 1),
                900: clamp(l - 0.62, 0, 1)
            };
            Object.keys(lightnessMap).forEach(key => {
                const ll = lightnessMap[key];
                // reduce saturation slightly for very light/dark tones
                const ss = clamp(s * (1 - Math.abs(0.5 - ll) * 0.6), 0, 1);
                scale[key] = rgbToHex(...hslToRgb(h, ss, ll));
            });

            if (mode === 'light') {
                // Light mode: backgrounds are light, text dark
                background = '#FFFFFF';
                text = '#23272A';
                // Use scale to assign secondary/tertiary
                secondary = scale[300];
                tertiary = scale[100];
                // accent: analogous hue shift with slightly higher saturation
                accent = rgbToHex(...hslToRgb(clamp(h + 20, 0, 360), clamp(s + 0.08, 0, 1), clamp(l + 0.04, 0, 1)));
            } else {
                // Dark mode: backgrounds are dark, text light
                background = '#0f1115';
                text = '#E6E6E8';
                // Use scale to assign secondary/tertiary for dark surfaces
                secondary = scale[700];
                tertiary = scale[800];
                // accent: complementary-ish via hue rotation towards +200deg for contrast
                accent = rgbToHex(...hslToRgb((h + 200) % 360, clamp(s + 0.12, 0, 1), clamp(l + 0.06, 0, 1)));
            }

            // Put the tonal scale into colors.scale for generateCSS
            return {
                primary,
                secondary,
                tertiary,
                accent,
                background,
                text,
                scale
            };
        } catch (e) {
            // fallback to defaults
            return {...this.defaultSettings.colors};
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
