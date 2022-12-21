import "core-js/stable";
import "regenerator-runtime/runtime";

require('./common')
require('./images/logo.png')
require('./images/radar_legend.png')
require('./gtm.js')

const GoogleSheetInput = require('./util/factory')

function addStylesheet(link) {
    let style = document.createElement("link");
    style.rel = "stylesheet"
    style.href = link
    return style
}

function addElement(id) {
    let element = document.createElement("div");
    element.id = id
    return element
}

customElements.define("technology-radar", class extends HTMLElement {
    stylesheet;

    constructor() {
        super();
        super.innerHTML = ""
        this.attachShadow({ mode: "open" });
        this.stylesheet = addStylesheet(this.hasAttribute("stylesheet") ? this.getAttribute("stylesheet") : `${window.location.origin}/main.css`)
        this.shadowRoot.appendChild(this.stylesheet)
        this.shadowRoot.appendChild(addElement("technology-radar"))
    }


    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "stylesheet":
                if (oldValue !== newValue) {
                    this.stylesheet.href = newValue;
                }
                break;
            case "":
                break;
        }
    }
    connectedCallback() {
        console.log("Loading Technology Radar via ", this.getAttribute("source") || window.location.href.match(/sheetId(.*)/) || "Loading Screen")
        this.stylesheet.href = this.hasAttribute("stylesheet") ? this.getAttribute("stylesheet") : `${window.location.origin}/main.css`;
        GoogleSheetInput().build(this.getAttribute("source"))
    }
});