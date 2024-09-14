// ==UserScript==
// @name         Remix Custom Filter
// @namespace    http://tampermonkey.net/
// @version      2024-09-14
// @description  Custom description filters for RemixShop
// @author       vasilvas99
// @match        https://www.tampermonkey.net/index.php?ext=dhdg&updated=true&version=5.2.3
// @match        https://remixshop.com/*
// @icon         https://remixshop.com/images/ld/logo/logo-remix.svg
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let minFilterValue = 80;
    let maxFilterValue = 100;
    let regexStringPattern = "Талия\\s+(\\d+)\\s+см";

    // Create the modal HTML
    const modalHTML = `
    <div id="filterConfigModal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); padding:20px; background-color:white; border:1px solid #ccc; z-index:9999;">
        <h2>Конфигурация на филтъра</h2>
        <label>Минимална стойност на филтъра:</label>
        <input type="number" id="minFilterValueInput" value="${minFilterValue}"><br><br>
        <label>Максимална стойност на филтъра:</label>
        <input type="number" id="maxFilterValueInput" value="${maxFilterValue}"><br><br>
        <label>Regex филтър на описание:</label>
        <input type="text" id="regexInput" value="${regexStringPattern}"><br><br>
        <button id="saveConfigButton">Запази</button>
        <button id="closeModalButton">Затвори</button>
    </div>
    `;

    // Append modal to body
    const body = document.getElementsByTagName('body')[0];
    body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById("filterConfigModal");
    const minFilterValueInput = document.getElementById("minFilterValueInput");
    const maxFilterValueInput = document.getElementById("maxFilterValueInput");
    const regexInput = document.getElementById("regexInput");
    const saveButton = document.getElementById("saveConfigButton");
    const closeButton = document.getElementById("closeModalButton");

    // Show configuration modal on Ctrl+Shift+B
    document.addEventListener("keydown", function (event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'B') {
            event.preventDefault();
            modal.style.display = "block";
        }
    });

    saveButton.addEventListener("click", function () {
        minFilterValue = parseInt(minFilterValueInput.value, 10);
        maxFilterValue = parseInt(maxFilterValueInput.value, 10);

        // switch if min is greater than max
        if (minFilterValue > maxFilterValue) {
            let temp = minFilterValue;
            minFilterValue = maxFilterValue;
            maxFilterValue = temp;

            // update modal values to match final state
            minFilterValueInput.value = minFilterValue;
            maxFilterValueInput.value = maxFilterValue;
        }
        regexStringPattern = regexInput.value;
        modal.style.display = "none";
    });

    // Close button functionality
    closeButton.addEventListener("click", function () {
        modal.style.display = "none";
    });

    document.addEventListener("keydown", function (event) {
        // Check if Ctrl+B is pressed
        if (event.ctrlKey && event.key === 'b') {
            // Prevent the default browser behavior for Ctrl+B (usually bold text in some editors)
            event.preventDefault();
            let regex = RegExp(regexStringPattern);

            console.log("Running filter script with configuration:");
            console.log("minFilterValue: " + minFilterValue);
            console.log("maxFilterValue: " + maxFilterValue);
            console.log("regex: " + regex);

            let list = $(".product-listing")[0];
            let items = list.children;
            for (let i = 0; i < items.length; i++) {
                let itemAnchor = items[i].getElementsByClassName("product-brand")[0];
                let url = itemAnchor.href;
                $.ajax({
                    url: url,
                    success: function (data) {
                        let parsedHTML = $(data);
                        let descriptions = parsedHTML.find('.product-description');
                        let descriptionsText = "";
                        descriptions.each(function () {
                            descriptionsText += $(this).text() + " ";
                        });
                        descriptionsText = descriptionsText.trim();

                        let reMatch = descriptionsText.match(regex);
                        let successfulMatch = false;
                        if (reMatch) {
                            let matchedNumericValue = parseInt(reMatch[1], 10);
                            if (matchedNumericValue >= minFilterValue && matchedNumericValue <= maxFilterValue) {
                                successfulMatch = true;
                            }
                        }

                        // Prevents spam of ✅ and ❌
                        if (itemAnchor.innerText.startsWith("✅") || itemAnchor.innerText.startsWith("❌")) {
                            itemAnchor.innerText = itemAnchor.innerText.substring(1);
                        }

                        if (successfulMatch) {
                            itemAnchor.innerText = "✅" + itemAnchor.innerText;
                        } else {
                            itemAnchor.innerText = "❌" + itemAnchor.innerText;
                        }
                    }
                });
            }
        }
    });
})();
