/* global markdown */
/* global Defiant */

var publicName = "Someone";

var currentDictionary = {
    name: "New",
    description: "A new dictionary.",
    createdBy: publicName,
    words: [],
    nextWordId: 1,
    settings: {
        allowDuplicates: false,
        caseSensitive: false,
        partsOfSpeech: "Noun,Adjective,Verb,Adverb,Preposition,Pronoun,Conjunction",
        sortByEquivalent: false,
        isComplete: false,
        isPublic: false
    },
    externalID: 0
}

var defaultDictionaryJSON = JSON.stringify(currentDictionary);  //Saves a stringifyed default dictionary.
var previousDictionary = {};

var savedScroll = {
    x: 0,
    y: 0
}

function AddWord() {
    var word = htmlEntities(document.getElementById("word").value).trim();
    var pronunciation = htmlEntities(document.getElementById("pronunciation").value).trim();
    var partOfSpeech = htmlEntities(document.getElementById("partOfSpeech").value).trim();
    var simpleDefinition = htmlEntities(document.getElementById("simpleDefinition").value).trim();
    var longDefinition = htmlEntities(document.getElementById("longDefinition").value);
    // var editIndex = htmlEntities(document.getElementById("editIndex").value);
    var errorMessageArea = document.getElementById("errorMessage");
    var errorMessage = "";
    var updateConflictArea = document.getElementById("updateConflict");
    
    if (word != "" && (simpleDefinition != "" || longDefinition != "")) {
        var wordIndex = (!currentDictionary.settings.allowDuplicates) ? WordIndex(word) : -1;

        if (wordIndex >= 0) {
            if (WordAtIndexWasChanged(wordIndex, word, pronunciation, partOfSpeech, simpleDefinition, longDefinition)) {
                document.getElementById("newWordButtonArea").style.display = "none";
                DisableForm('');
                updateConflictArea.style.display = "block";
                
                var updateConflictText = "<span id='updateConflictMessage'>\"" + word + "\" is already in the dictionary";
                if (currentDictionary.words[wordIndex].name != word) {
                    updateConflictText += " as \"" + currentDictionary.words[wordIndex].name + "\", and your dictionary is set to ignore case.";
                } else {
                    updateConflictText += "."
                }
                updateConflictText += "<br>Do you want to update it to what you have set above?</span>";
                updateConflictText += '<button type="button" id="updateConfirmButton" \
                                                  onclick="UpdateWord(' + wordIndex + ', \'' + htmlEntities(word) + '\', \'' + htmlEntities(pronunciation) + '\', \'' + htmlEntities(partOfSpeech) + '\', \'' + htmlEntities(simpleDefinition) + '\', \'' + htmlEntities(longDefinition) + '\'); \
                                                  return false;">Yes, Update it</button>';
                updateConflictText += ' <button type="button" id="updateCancelButton" onclick="CloseUpdateConflictArea(\'\'); return false;">No, Leave it</button>';
                
                updateConflictArea.innerHTML = updateConflictText;
            } else {
                errorMessage = "\"" + word + "\" is already in the dictionary exactly as it is written above";
                if (currentDictionary.words[wordIndex].name != word) {
                    errorMessage += ". (Your dictionary is currently set to ignore case.)"
                }
            }
        } else {
            currentDictionary.words.push({name: word, pronunciation: pronunciation, partOfSpeech: ((partOfSpeech.length > 0) ? partOfSpeech : " "), simpleDefinition: simpleDefinition, longDefinition: longDefinition, wordId: currentDictionary.nextWordId++});
            SaveAndUpdateWords("new");
            FocusAfterAddingNewWord();
            NewWordNotification(word);
        }

        errorMessageArea.innerHTML = "";
    } else {
        if (word == "") {
            errorMessage += "Word cannot be blank";
            if (simpleDefinition == "" && longDefinition == "") {
                errorMessage += " and you need at least one definition.";
            } else {
                errorMessage += ".";
            }
        } else if (simpleDefinition == "" && longDefinition == "") {
            errorMessage += "You need at least one definition."
        }
    }
    
    errorMessageArea.innerHTML = errorMessage;
}

function ShowWordEditForm(index) {
    var indexString = index.toString(); // Variable for reduced processing
    var word = currentDictionary.words[index];  // Reference for easier reading
    var editForm = '<form id="editForm' + indexString + '">\
                <h2>Editing ' + htmlEntitiesParse(word.name) + '</h2>\
                <label><span>Word</span>\
                    <input type="text" id="word' + indexString + '" value="' + htmlEntitiesParse(word.name) + '" onkeydown="SubmitWordOnCtrlEnter(this)" />\
                </label>\
                <label><span>Pronunciation <a class="helperlink" href="/ipa_character_picker/" target="_blank" title="IPA Character Picker backed up from http://r12a.github.io/pickers/ipa/">IPA Characters</a></span>\
                    <input type="text" id="pronunciation' + indexString + '" value="' + htmlEntitiesParse(word.pronunciation) + '" onkeydown="SubmitWordOnCtrlEnter(this)" />\
                </label>\
                <label><span>Part of Speech</span>\
                    <select id="partOfSpeech' + indexString + '" onkeydown="SubmitWordOnCtrlEnter(this)"></select>\
                </label>\
                <label><span>Equivalent Word(s)</span>\
                    <input type="text" id="simpleDefinition' + indexString + '" value="' + htmlEntitiesParse(word.simpleDefinition) + '" onkeydown="SubmitWordOnCtrlEnter(this)" />\
                </label>\
                <label><span>Explanation/Long Definition <span id="showFullScreenTextbox" class="clickable" onclick="ShowFullScreenTextbox(\'longDefinition' + indexString + '\', \'Explanation/Long Definition\')">Maximize</span></span>\
                    <textarea id="longDefinition' + indexString + '" onkeydown="SubmitWordOnCtrlEnter(this)">' + htmlEntitiesParse(word.longDefinition) + '</textarea>\
                </label>\
                <span id="errorMessage' + indexString + '"></span>\
                <div id="editWordButtonArea' + indexString + '" style="display: block;">\
                    <button type="button" onclick="EditWord(\'' + indexString + '\'); return false;">Edit Word</button> <button type="button" onclick="CancelEditForm(' + indexString + '); return false;">Cancel</button>\
                </div>\
                <div id="updateConflict' + indexString + '" style="display: none;"></div>\
            </form>';

    document.getElementById("entry" + indexString).innerHTML = editForm;

    SetPartsOfSpeech("partOfSpeech" + indexString);
    document.getElementById("partOfSpeech" + indexString).value = htmlEntitiesParse(word.partOfSpeech);
}

function CancelEditForm(index) {
    document.getElementById("entry" + index.toString()).innerHTML = DictionaryEntry(index).replace("<entry id='entry" + index.toString() + "'>", "").replace("</entry>", "");
}

function EditWord(indexString) {
    var word = htmlEntities(document.getElementById("word" + indexString).value).trim();
    var pronunciation = htmlEntities(document.getElementById("pronunciation" + indexString).value).trim();
    var partOfSpeech = htmlEntities(document.getElementById("partOfSpeech" + indexString).value).trim();
    var simpleDefinition = htmlEntities(document.getElementById("simpleDefinition" + indexString).value).trim();
    var longDefinition = htmlEntities(document.getElementById("longDefinition" + indexString).value);

    var errorMessageArea = document.getElementById("errorMessage" + indexString);
    var errorMessage = "";
    var updateConflictArea = document.getElementById("updateConflict" + indexString);

    if (WordAtIndexWasChanged(indexString, word, pronunciation, partOfSpeech, simpleDefinition, longDefinition)) {
        document.getElementById("editWordButtonArea" + indexString).style.display = "none";
        DisableForm(indexString);
        updateConflictArea.style.display = "block";
        updateConflictArea.innerHTML = "<span id='updateConflictMessage" + indexString + "'>Do you really want to change the word \"" + currentDictionary.words[parseInt(indexString)].name + "\" to what you have set above?</span><br>";
        updateConflictArea.innerHTML += '<button type="button" id="updateConfirmButton' + indexString + '" \
                                          onclick="UpdateWord(' + indexString + ', \'' + htmlEntities(word) + '\', \'' + htmlEntities(pronunciation) + '\', \'' + htmlEntities(partOfSpeech) + '\', \'' + htmlEntities(simpleDefinition) + '\', \'' + htmlEntities(longDefinition) + '\'); \
                                          return false;">Yes, Update it</button>';
        updateConflictArea.innerHTML += '<button type="button" id="updateCancelButton' + indexString + '" onclick="CloseUpdateConflictArea(\'' + indexString + '\'); return false;">No, Leave it</button>';
    } else {
        errorMessage = "No change has been made to \"" + word + "\"";
        if (currentDictionary.words[parseInt(indexString)].name != word) {
            errorMessage += ". (Your dictionary is currently set to ignore case.)";
        }
    }

    errorMessageArea.innerHTML = errorMessage;
}

function UpdateWord(wordIndex, word, pronunciation, partOfSpeech, simpleDefinition, longDefinition) {
    currentDictionary.words[wordIndex].name = word;
    currentDictionary.words[wordIndex].pronunciation = pronunciation;
    currentDictionary.words[wordIndex].partOfSpeech = ((partOfSpeech.length > 0) ? partOfSpeech : " ");
    currentDictionary.words[wordIndex].simpleDefinition = simpleDefinition;
    currentDictionary.words[wordIndex].longDefinition = longDefinition;

    SaveAndUpdateWords("update", wordIndex);
    ClearForm();

    window.scroll(savedScroll.x, savedScroll.y);

    if (!wordFormIsLocked()) {
        FocusAfterAddingNewWord();
    }
}

function DeleteWord(index) {
    var deleteWord = new XMLHttpRequest();
    deleteWord.open('POST', "php/ajax_dictionarymanagement.php?action=worddelete");
    deleteWord.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    deleteWord.onreadystatechange = function() {
        if (deleteWord.readyState == 4 && deleteWord.status == 200) {
            if (deleteWord.responseText == "deleted successfully") {
                // If updated successfully, then reload the dictionary from server.
                if (document.getElementById("editIndex").value != "")
                    ClearForm();

                currentDictionary.words.splice(index, 1);
                
                SaveAndUpdateDictionary(true);
            }
            console.log(deleteWord.responseText);
            return true;
        } else {
            return false;
        }
    }
    deleteWord.send("word=" + currentDictionary.words[index].wordId.toString());
}

function ShowDictionary() {
    var filters = GetSelectedFilters();
    
    var searchResults = [];
    var search = htmlEntitiesParseForSearchEntry(document.getElementById("searchBox").value);
    var searchByWord = document.getElementById("searchOptionWord").checked;
    var searchBySimple = document.getElementById("searchOptionSimple").checked;
    var searchByLong = document.getElementById("searchOptionLong").checked;
    var searchIgnoreCase = !document.getElementById("searchCaseSensitive").checked; //It's easier to negate case here instead of negating it every use since ignore case is default.
    var searchIgnoreDiacritics = document.getElementById("searchIgnoreDiacritics").checked;
    if (search != "" && (searchByWord || searchBySimple || searchByLong)) {
        var xpath = [];
        var searchDictionaryJSON = htmlEntitiesParseForSearch(JSON.stringify(currentDictionary));
        if (searchIgnoreCase) {
            search = search.toLowerCase();
        }
        if (searchIgnoreDiacritics) {
            search = removeDiacritics(search);
            searchDictionaryJSON = removeDiacritics(searchDictionaryJSON);
        }
        if (searchByWord) {
            xpath.push('contains('+ ((searchIgnoreCase) ? 'name' : 'translate(name, "", "")') +', "'+ search +'")');
        }
        if (searchBySimple) {
            xpath.push('contains('+ ((searchIgnoreCase) ? 'simpleDefinition' : 'translate(simpleDefinition, "", "")') +', "'+ search +'")');
        }
        if (searchByLong) {
            xpath.push('contains('+ ((searchIgnoreCase) ? 'longDefinition' : 'translate(longDefinition, "", "")') +', "'+ search +'")');
        }
        var searchDictionary = JSON.parse(searchDictionaryJSON);
        searchResults = JSON.search(searchDictionary, '//words['+ xpath.join(' or ') +']/wordId');
    }
    
    var dictionaryNameArea = document.getElementById("dictionaryName");
    dictionaryNameArea.innerHTML = htmlEntitiesParse(currentDictionary.name) + " Dictionary";
    
    var dictionaryDescriptionArea = document.getElementById("dictionaryDescription");
    dictionaryDescriptionArea.innerHTML = marked(htmlEntitiesParse(currentDictionary.description));
    
    var dictionaryArea = document.getElementById("theDictionary");
    var dictionaryText = "";
    var numberOfWordsDisplayed = 0;

    if (currentDictionary.words.length > 0) {
        for (var i = 0; i < currentDictionary.words.length; i++) {
            if (filters.length == 0 || (filters.length > 0 && filters.indexOf(currentDictionary.words[i].partOfSpeech) > -1)) {
                if (search == "" || (search != "" && (searchByWord || searchBySimple || searchByLong) && searchResults.indexOf(currentDictionary.words[i].wordId) >= 0)) {
                    if (!currentDictionary.words[i].hasOwnProperty("pronunciation")) {
                        currentDictionary.words[i].pronunciation = "";  //Account for new property
                    }
                    if (!currentDictionary.words[i].hasOwnProperty("wordId")) {
                        currentDictionary.words[i].wordId = i + 1;  //Account for new property
                    }
                    dictionaryText += DictionaryEntry(i);
                    numberOfWordsDisplayed++;
                }
            }
        }
    } else {
        dictionaryText = "There are no entries in the dictionary."
    }

    dictionaryArea.innerHTML = dictionaryText;
    ShowFilterWordCount(numberOfWordsDisplayed);
}

function DictionaryEntry(itemIndex) {
    displayPublic = (typeof displayPublic !== 'undefined' && displayPublic != null) ? displayPublic : false;
    var entryText = "<entry id='entry" + itemIndex.toString() + "'><a name='" + currentDictionary.words[itemIndex].wordId + "'></a><a href='#" + currentDictionary.words[itemIndex].wordId + "' class='wordLink clickable'>&#x1f517;</a>";
    
    var searchTerm = regexParseForSearch(document.getElementById("searchBox").value);
    var searchByWord = document.getElementById("searchOptionWord").checked;
    var searchBySimple = document.getElementById("searchOptionSimple").checked;
    var searchByLong = document.getElementById("searchOptionLong").checked;
    var searchIgnoreCase = !document.getElementById("searchCaseSensitive").checked; //It's easier to negate case here instead of negating it every use since ignore case is default.
    var searchIgnoreDiacritics = document.getElementById("searchIgnoreDiacritics").checked;
    
    var searchRegEx = new RegExp("(" + ((searchIgnoreDiacritics) ? removeDiacritics(searchTerm) + "|" + searchTerm : searchTerm) + ")", "g" + ((searchIgnoreCase) ? "i" : ""));

    entryText += "<word>";

    if (searchTerm != "" && searchByWord) {
        entryText += htmlEntitiesParse(currentDictionary.words[itemIndex].name).replace(searchRegEx, "<searchTerm>$1</searchterm>");
    } else {
        entryText += currentDictionary.words[itemIndex].name;
    }
    
    entryText += "</word>";
    
    if (currentDictionary.words[itemIndex].pronunciation != "") {
        entryText += "<pronunciation>";
        entryText += marked(htmlEntitiesParse(currentDictionary.words[itemIndex].pronunciation)).replace("<p>","").replace("</p>","");
        entryText += "</pronunciation>";
    }
    
    if (currentDictionary.words[itemIndex].partOfSpeech != "") {
        entryText += "<partofspeech>";
        entryText += currentDictionary.words[itemIndex].partOfSpeech;
        entryText += "</partofspeech>";
    }

    entryText += "<br>";

    if (currentDictionary.words[itemIndex].simpleDefinition != "") {
        entryText += "<simpledefinition>";
        
        if (searchTerm != "" && searchBySimple) {
            entryText += htmlEntitiesParse(currentDictionary.words[itemIndex].simpleDefinition).replace(searchRegEx, "<searchTerm>$1</searchterm>");
        } else {
            entryText += currentDictionary.words[itemIndex].simpleDefinition;
        }

        entryText += "</simpledefinition>";
    }

    if (currentDictionary.words[itemIndex].longDefinition != "") {
        entryText += "<longdefinition>";

        if (searchTerm != "" && searchByLong) {
            entryText += marked(htmlEntitiesParse(currentDictionary.words[itemIndex].longDefinition).replace(searchRegEx, "<searchTerm>$1</searchterm>"));
        } else {
            entryText += marked(htmlEntitiesParse(currentDictionary.words[itemIndex].longDefinition));
        }

        entryText += "</longdefinition>";
    }

    if (!currentDictionary.settings.isComplete) {
        entryText += ManagementArea(itemIndex);
    }

    entryText += "</entry>";

    return entryText;
}

function ManagementArea(itemIndex) {
    var managementHTML = "<div class='management'>";

    managementHTML += "<span class='clickable editButton' onclick='ShowWordEditForm(" + itemIndex + ")'>Edit</span>";
    managementHTML += "<span class='clickable deleteButton' onclick='document.getElementById(\"delete" + itemIndex + "Confirm\").style.display = \"block\";'>Delete</span>";

    managementHTML += "<div class='deleteConfirm' id='delete" + itemIndex + "Confirm' style='display:none;'>Are you sure you want to delete this entry?<br><br>";
    managementHTML += "<span class='clickable deleteCancelButton' onclick='document.getElementById(\"delete" + itemIndex + "Confirm\").style.display = \"none\";'>No</span>";
    managementHTML += "<span class='clickable deleteConfirmButton' onclick='DeleteWord(" + itemIndex + ")'>Yes</span>";
    managementHTML += "</div>";

    managementHTML += "</div>";

    return managementHTML;
}

function SaveSettings() {
    if (htmlEntities(document.getElementById("dictionaryNameEdit").value) != "") {
        currentDictionary.name = htmlEntities(document.getElementById("dictionaryNameEdit").value);
    }
    
    currentDictionary.description = htmlEntities(document.getElementById("dictionaryDescriptionEdit").value);
    
    CheckForPartsOfSpeechChange();
    
    currentDictionary.settings.allowDuplicates = document.getElementById("dictionaryAllowDuplicates").checked;
    currentDictionary.settings.caseSensitive = document.getElementById("dictionaryCaseSensitive").checked;
    
    currentDictionary.settings.sortByEquivalent = document.getElementById("dictionarySortByEquivalent").checked;
    
    currentDictionary.settings.isComplete = document.getElementById("dictionaryIsComplete").checked;
    if (document.getElementById("dictionaryIsPublic")) {
        currentDictionary.settings.isPublic = document.getElementById("dictionaryIsPublic").checked;
    }
    
    HideSettingsWhenComplete();
    
    SaveAndUpdateDictionary(true);
    LoadUserDictionaries();
}

function EmptyWholeDictionary() {
    if (confirm("This will delete the entire current dictionary. If you do not have a backed up export, you will lose it forever!\n\nDo you still want to delete?")) {
        CreateNewDictionary();
    }
}

function CreateNewDictionary() {
    ResetDictionaryToDefault();
    SaveAndUpdateDictionary(false);
    SetPartsOfSpeech();
    HideSettings();
    ShowSettings();
    document.getElementById("dictionaryNameEdit").focus();
}

function DeleteCurrentDictionary() {
    if (confirm("This will delete the current dictionary from the database. If you do not have a backed up export, you will lose it forever!\n\nDo you still want to delete?")) {
        ResetDictionaryToDefault();
        
        var deleteDictionary = new XMLHttpRequest();
        deleteDictionary.open('POST', "php/ajax_dictionarymanagement.php?action=delete");
        deleteDictionary.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        deleteDictionary.onreadystatechange = function() {
            if (deleteDictionary.readyState == 4 && deleteDictionary.status == 200) {
                if (deleteDictionary.responseText.length < 31) {
                    console.log(deleteDictionary.responseText);
                    CreateNewDictionary();
                } else {
                    HideSettings();
                    ShowDictionaryDeleteMenu(deleteDictionary.responseText);

                    if (document.getElementById("loadAfterDelete").options.length == 0) {
                        document.getElementById('loadAfterDeleteScreen').style.display = 'none';
                        CreateNewDictionary();
                    }
                }
                return true;
            } else {
                return false;
            }
        }
        deleteDictionary.send();
    }
}


function ResetDictionaryToDefault() {
    currentDictionary = JSON.parse(defaultDictionaryJSON);
}

function SaveAndUpdateWords(action, wordIndex) {
    var dataToSend = "";
    if (action == "all") {
        // For dictionaries not already in the db. Send all the words to database.
        dataToSend = JSON.stringify(currentDictionary.words);
    } else if (action == "update") {
        // Only send the specified word to update.
        dataToSend = JSON.stringify(currentDictionary.words[wordIndex]);
    } else if (action == "new") {
        // Send the last word pushed to the words array before it's sorted.
        dataToSend = JSON.stringify(currentDictionary.words[currentDictionary.words.length - 1]);
    }

    var sendWords = new XMLHttpRequest();
    sendWords.open('POST', "php/ajax_dictionarymanagement.php?action=word" + action + "&nextwordid=" + currentDictionary.nextWordId.toString());
    sendWords.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    sendWords.onreadystatechange = function() {
        if (sendWords.readyState == 4 && sendWords.status == 200) {
            if (!currentDictionary.settings.sortByEquivalent) {
                currentDictionary.words.sort(dynamicSort(['name', 'partOfSpeech']));
            } else {
                currentDictionary.words.sort(dynamicSort(['simpleDefinition', 'partOfSpeech']));
            }
            ProcessLoad();
            console.log(sendWords.responseText);
            return true;
        } else {
            return false;
        }
    }
    sendWords.send(dataToSend);
}

function SaveAndUpdateDictionary(keepFormContents) {
    // if (!currentDictionary.settings.sortByEquivalent) {
    //     currentDictionary.words.sort(dynamicSort(['name', 'partOfSpeech']));
    // } else {
    //     currentDictionary.words.sort(dynamicSort(['simpleDefinition', 'partOfSpeech']));
    // }
    SaveDictionary(true);
    ShowDictionary();
    if (!keepFormContents) {
        ClearForm();
    }
    CloseUpdateConflictArea('');
}

function SaveDictionary(sendToDatabase) {
    //Always save local copy of current dictionary, but if logged in also send to database.
    if (sendToDatabase) {
        SendDictionary();
    }
    
    localStorage.setItem('dictionary', JSON.stringify(currentDictionary));
    
    SavePreviousDictionary();
}

function SendDictionary() {
    var action = "";
    var postString = "";
    if (currentDictionary.externalID > 0) {
        action = "update";
        postString = DataToSend(false);
    } else {
        action = "new";
        postString = DataToSend(true);
    }

    var sendDictionary = new XMLHttpRequest();
    sendDictionary.open('POST', "php/ajax_dictionarymanagement.php?action=" + action);
    sendDictionary.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    sendDictionary.onreadystatechange = function() {
        if (sendDictionary.readyState == 4 && sendDictionary.status == 200) {
            if (sendDictionary.responseText == "updated successfully") {
                console.log(sendDictionary.responseText);
                LoadUserDictionaries();
                ProcessLoad();
            } else if (isNaN(parseInt(sendDictionary.responseText))) {
                console.log(sendDictionary.responseText);
            } else {    // It will only be a number if it is a new dictionary.
                currentDictionary.externalID = parseInt(sendDictionary.responseText);
                if (currentDictionary.words.length > 0) {
                    SaveAndUpdateWords("all");
                }
                LoadUserDictionaries();
                ProcessLoad();
                console.log("saved " + parseInt(sendDictionary.responseText).toString() + " successfully");
            }
            return true;
        } else {
            return false;
        }
    }
    sendDictionary.send(postString);
}

function DataToSend(sendAll) {
    sendAll = (typeof sendAll !== 'undefined' && sendAll != null) ? sendAll : false;
    var data = "";
    if (currentDictionary.externalID == 0) {
        data = "name=" + encodeURIComponent(currentDictionary.name) + "&description=" + encodeURIComponent(currentDictionary.description) + "&words=" + encodeURIComponent(JSON.stringify(currentDictionary.words));
        data += "&nextwordid=" + currentDictionary.nextWordId + "&allowduplicates=" + ((currentDictionary.settings.allowDuplicates) ? "1" : "0") + "&casesensitive=" + ((currentDictionary.settings.caseSensitive) ? "1" : "0");
        data += "&partsofspeech=" + encodeURIComponent(currentDictionary.settings.partsOfSpeech) + "&sortbyequivalent=" + ((currentDictionary.settings.sortByEquivalent) ? "1" : "0") + "&iscomplete=" + ((currentDictionary.settings.isComplete) ? "1" : "0") + "&ispublic=" + ((currentDictionary.settings.isPublic) ? "1" : "0") + "";
    } else {
        if (sendAll || currentDictionary.name != previousDictionary.name) {
            data += "name=" + encodeURIComponent(currentDictionary.name);
        }
        if (sendAll || currentDictionary.description != previousDictionary.description) {
            data += ((data=="") ? "" : "&") + "description=" + encodeURIComponent(currentDictionary.description);
        }
        if (sendAll || currentDictionary.nextWordId != previousDictionary.nextWordId) {
            data += ((data=="") ? "" : "&") + "nextwordid=" + currentDictionary.nextWordId;
        }
        if (sendAll || currentDictionary.settings.allowDuplicates != previousDictionary.allowDuplicates) {
            data += ((data=="") ? "" : "&") + "allowduplicates=" + ((currentDictionary.settings.allowDuplicates) ? "1" : "0");
        }
        if (sendAll || currentDictionary.settings.caseSensitive != previousDictionary.caseSensitive) {
            data += ((data=="") ? "" : "&") + "casesensitive=" + ((currentDictionary.settings.caseSensitive) ? "1" : "0");
        }
        if (sendAll || currentDictionary.settings.partsOfSpeech != previousDictionary.partsOfSpeech) {
            data += ((data=="") ? "" : "&") + "partsofspeech=" + encodeURIComponent(currentDictionary.settings.partsOfSpeech);
        }
        if (sendAll || currentDictionary.settings.sortByEquivalent != previousDictionary.sortByEquivalent) {
            data += ((data=="") ? "" : "&") + "sortbyequivalent=" + ((currentDictionary.settings.sortByEquivalent) ? "1" : "0");
        }
        if (sendAll || currentDictionary.settings.isComplete != previousDictionary.isComplete) {
            data += ((data=="") ? "" : "&") + "iscomplete=" + ((currentDictionary.settings.isComplete) ? "1" : "0");
        }
        if (sendAll || currentDictionary.settings.isPublic != previousDictionary.isPublic) {
            data += ((data=="") ? "" : "&") + "ispublic=" + ((currentDictionary.settings.isPublic) ? "1" : "0");
        }
    }
    return data;
}

function LoadDictionary() {
    LoadLocalDictionary();
    var loadDictionary = new XMLHttpRequest();
    loadDictionary.open('GET', "php/ajax_dictionarymanagement.php?action=load");
    loadDictionary.onreadystatechange = function() {
        if (loadDictionary.readyState == 4 && loadDictionary.status == 200) {
            if (loadDictionary.responseText == "no dictionaries") {
                // If there are no dictionaries in the database and there's one in memory, remove the id & public setting and send it as a new one.
                currentDictionary.externalID = 0;
                currentDictionary.settings.isPublic = false;
                SendDictionary(true);
            } else if (loadDictionary.responseText.length < 60) {
                console.log(loadDictionary.responseText);
            } else {
                currentDictionary = JSON.parse(loadDictionary.responseText);
                SaveDictionary(false);
            }
        }
        ProcessLoad();
    }
    loadDictionary.send();
}

function ChangeDictionary(userDictionariesSelect) {
    userDictionariesSelect = (typeof userDictionariesSelect !== 'undefined' && userDictionariesSelect != null) ? userDictionariesSelect : document.getElementById("userDictionaries");
    if (currentDictionary.externalID != userDictionariesSelect.value && userDictionariesSelect.options.length > 0) {
        var changeDictionaryRequest = new XMLHttpRequest();
        changeDictionaryRequest.open('POST', "php/ajax_dictionarymanagement.php?action=switch");
        changeDictionaryRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        var postString = "newdictionaryid=" + userDictionariesSelect.value.toString();
        changeDictionaryRequest.onreadystatechange = function() {
            if (changeDictionaryRequest.readyState == 4 && changeDictionaryRequest.status == 200) {
                if (changeDictionaryRequest.responseText == "no dictionaries") {
                    console.log(changeDictionaryRequest.responseText);
                    SendDictionary(false);
                } else if (changeDictionaryRequest.responseText.length < 60) {
                    console.log(changeDictionaryRequest.responseText);
                } else {
                    currentDictionary = JSON.parse(changeDictionaryRequest.responseText);
                    SaveDictionary(false);
                    ProcessLoad();
                    LoadUserDictionaries();
                    HideSettings();
                }
            }
        }
        changeDictionaryRequest.send(postString);
    }
}

function LoadLocalDictionary() {
    if (localStorage.getItem('dictionary')) {
        var tmpDictionary = JSON.parse(localStorage.getItem('dictionary'));
        if (tmpDictionary.words.length > 0 || tmpDictionary.description != "A new dictionary." || tmpDictionary.name != "New") {
            currentDictionary = JSON.parse(localStorage.getItem('dictionary'));
        }
        tmpDictionary = null;
    }
}

function ProcessLoad() {
    if (!currentDictionary.hasOwnProperty("nextWordId")) {
        currentDictionary.nextWordId = currentDictionary.words.length + 1;
    }

    HideSettingsWhenComplete();
    
    ShowDictionary();

    SetPartsOfSpeech();
    
    if (currentDictionary.settings.isComplete) {
        document.getElementById("wordEntryForm").style.display = "none";
    }
    
    SavePreviousDictionary();
}

function SavePreviousDictionary () {
    // Save non-word data to check if anything has changed (words can identify themselves if changed).
    // Used to minimize data pushed to database.
    previousDictionary = {
        name: currentDictionary.name,
        description: currentDictionary.description,
        nextWordId: currentDictionary.nextWordId,
        allowDuplicates: currentDictionary.settings.allowDuplicates,
        caseSensitive: currentDictionary.settings.caseSensitive,
        partsOfSpeech: currentDictionary.settings.partsOfSpeech,
        sortByEquivalent: currentDictionary.settings.sortByEquivalent,
        isComplete: currentDictionary.settings.isComplete,
        isPublic: currentDictionary.settings.isPublic
    };
}

function ExportDictionary() {
    if (currentDictionary.words.length > 0) {
        var downloadName = removeDiacritics(stripHtmlEntities(currentDictionary.name)).replace(/\W/g, '');
        if (downloadName == "") {
            downloadName = "export";
        }
        download(downloadName + ".dict", localStorage.getItem('dictionary'));
    } else {
        alert("Dictionary must have at least 1 word to export.")
    }
}

function ImportDictionary() {
    if (currentDictionary.externalID > 0 || confirm("Importing this dictionary will overwrite your current one, making it impossible to retrieve if you have not already exported it! Do you still want to import?")) {
        if (!window.FileReader) {
            alert('Your browser is not supported');
            return false;
        }

        var reader = new FileReader();
        if (document.getElementById("importFile").files.length > 0) {
            var file = document.getElementById("importFile").files[0];
            // Read the file
            reader.readAsText(file);
            // When it's loaded, process it
            reader.onloadend = function () {
                if (reader.result && reader.result.length) {
                    var tmpDicitonary = JSON.parse(reader.result);
                    
                    if (tmpDicitonary.hasOwnProperty("name") && tmpDicitonary.hasOwnProperty("description") &&
                        tmpDicitonary.hasOwnProperty("words") && tmpDicitonary.hasOwnProperty("settings"))
                    {
                        currentDictionary = JSON.parse(reader.result);
                        currentDictionary.externalID = 0;   // Reset external id for imported dictionary.
                        currentDictionary.settings.isPublic = false;   // Reset public setting for imported dictionary.
                        SaveDictionary(true);
                        ProcessLoad();
                        HideSettings();
                        document.getElementById("importFile").value = "";
                    } else {
                        var errorString = "File is missing:";
                        if (!tmpDicitonary.hasOwnProperty("name"))
                            errorString += " name";
                        if (!tmpDicitonary.hasOwnProperty("description"))
                            errorString += " description";
                        if (!tmpDicitonary.hasOwnProperty("words"))
                            errorString += " words";
                        if (!tmpDicitonary.hasOwnProperty("settings"))
                            errorString += " settings";
                        alert("Uploaded file is not compatible.\n\n" + errorString);
                    }
                    
                    tmpDicitonary = null;
                } else {
                    alert("Upload Failed");
                }
                reader = null;
            }
        } else {
            alert("You must add a file to import.");
        }
    }
}

function ImportWords() {
    if (currentDictionary.externalID > 0 || confirm("This will add words in a correctly formatted CSV file to your currently loaded dictionary. Do you still want to import?")) {
        if (!window.FileReader) {
            alert('Your browser is not supported');
            return false;
        }

        if (document.getElementById("importWordsCSV").files.length > 0) {
            var file = document.getElementById("importWordsCSV").files[0];

            var resultsArea = document.getElementById("importOptions");
            resultsArea.innerHTML = "";

            var currentRow = 0; // Because of the header, the first row of data is always on line 2.
            var rowsImported = 0;

            Papa.parse(file, {
                header: true,
                step: function(row, parser) {
                    currentRow++;
                    // If there are no errors OR the word and either equivalent or explanation contain data, then import it.
                    if ((row.data[0].word.trim().length > 0 && (row.data[0].equivalent.trim().length > 0 || row.data[0].explanation.trim().length > 0)) || row.errors.length == 0) {
                        currentDictionary.words.push({name: htmlEntities(row.data[0]["word"]).trim(), pronunciation: htmlEntities(row.data[0]["pronunciation"]).trim(), partOfSpeech: ((htmlEntities(row.data[0]["part of speech"]).trim().length > 0) ? htmlEntities(row.data[0]["part of speech"]).trim() : " "), simpleDefinition: htmlEntities(row.data[0]["equivalent"]).trim(), longDefinition: htmlEntities(row.data[0]["explanation"]).trim(), wordId: currentDictionary.nextWordId++});
                        resultsArea.innerHTML += "<p>Imported \"" + htmlEntitiesParse(htmlEntities(row.data[0]["word"])).trim() + "\" successfully</p>";
                        rowsImported++;
                    } else {
                        // If it's not just an empty line, give an error.
                        if (row.data[0].word.trim().length > 0) {
                            for (var i = 0; i < row.errors.length; i++) {
                                resultsArea.innerHTML += "<p>Error on record #" + currentRow.toString() + ": " + row.errors[i].message + "</p>";
                            }
                        }
                    }
                    // Scroll to the bottom.
                    document.getElementById("importOptions").scrollTop = document.getElementById("importOptions").scrollHeight;
                },
                complete: function(results) {
                    SaveAndUpdateDictionary();
                    resultsArea.innerHTML += "<p>The file has finished importing " + rowsImported.toString() + " words.</p>";
                    // Scroll to the bottom.
                    document.getElementById("importOptions").scrollTop = document.getElementById("importOptions").scrollHeight;
                    document.getElementById("numberOfWordsInDictionary").innerHTML = currentDictionary.words.length.toString();
                }
            });
        } else {
            alert("You must add a file to import.");
        }
    }
}

function WordIndex(word) {
    for (var i = 0; i < currentDictionary.words.length; i++)
    {
        if ((!currentDictionary.settings.caseSensitive && currentDictionary.words[i].name.toLowerCase() == word.toLowerCase()) ||
            (currentDictionary.settings.caseSensitive && currentDictionary.words[i].name == word)) {
            return i;
        }
    }
    return -1;
}

function WordAtIndexWasChanged(indexString, word, pronunciation, partOfSpeech, simpleDefinition, longDefinition) {
     return (!currentDictionary.settings.caseSensitive && currentDictionary.words[parseInt(indexString)].name.toLowerCase() != word.toLowerCase()) ||
            (currentDictionary.settings.caseSensitive && currentDictionary.words[parseInt(indexString)].name != word) ||
            currentDictionary.words[parseInt(indexString)].pronunciation != pronunciation ||
            currentDictionary.words[parseInt(indexString)].partOfSpeech != partOfSpeech ||
            currentDictionary.words[parseInt(indexString)].simpleDefinition != simpleDefinition ||
            currentDictionary.words[parseInt(indexString)].longDefinition != longDefinition;
}

function CheckForPartsOfSpeechChange() {
    if (htmlEntities(document.getElementById("dictionaryPartsOfSpeechEdit").value) != currentDictionary.settings.partsOfSpeech) {
        if (htmlEntities(document.getElementById("dictionaryPartsOfSpeechEdit").value) != "") {
            currentDictionary.settings.partsOfSpeech = htmlEntities(document.getElementById("dictionaryPartsOfSpeechEdit").value);
            SetPartsOfSpeech();
        }
    }
}
