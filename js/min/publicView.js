function IsValidPublicDicitonary(){return"string"!=typeof publicDictionary}function ShowPublicDictionary(){if(IsValidPublicDicitonary()){var e=document.getElementById("wordFilter").value,i=[],t=htmlEntitiesParseForSearchEntry(document.getElementById("searchBox").value),n=document.getElementById("searchOptionWord").checked,r=document.getElementById("searchOptionSimple").checked,c=document.getElementById("searchOptionLong").checked,o=!document.getElementById("searchCaseSensitive").checked,a=document.getElementById("searchIgnoreDiacritics").checked;if(""!=t&&(n||r||c)){var d=[],s=htmlEntitiesParseForSearch(JSON.stringify(publicDictionary));o&&(t=t.toLowerCase()),a&&(t=removeDiacritics(t),s=removeDiacritics(s)),n&&d.push("contains("+(o?"name":'translate(name, "", "")')+', "'+t+'")'),r&&d.push("contains("+(o?"simpleDefinition":'translate(simpleDefinition, "", "")')+', "'+t+'")'),c&&d.push("contains("+(o?"longDefinition":'translate(longDefinition, "", "")')+', "'+t+'")');var l=JSON.parse(s);i=JSON.search(l,"//words["+d.join(" or ")+"]/wordId")}var m=document.getElementById("dictionaryName");m.innerHTML=htmlEntitiesParse(publicDictionary.name)+" Dictionary";var p=document.getElementById("dictionaryBy");p.innerHTML="created by "+htmlEntitiesParse(publicDictionary.createdBy);var u=document.getElementById("incompleteNotice");publicDictionary.settings.isComplete||(u.innerHTML="<em>Note: This dictionary is not yet complete and is likely to change.</em>");var y=document.getElementById("dictionaryDescription");y.innerHTML=marked(htmlEntitiesParse(publicDictionary.description));var h=document.getElementById("theDictionary"),D="",g=0;if(publicDictionary.words.length>0)for(var w=0;w<publicDictionary.words.length;w++)(""==e||""!=e&&publicDictionary.words[w].partOfSpeech==e)&&(""==t||""!=t&&(n||r||c)&&i.indexOf(publicDictionary.words[w].wordId)>=0)&&(publicDictionary.words[w].hasOwnProperty("pronunciation")||(publicDictionary.words[w].pronunciation=""),publicDictionary.words[w].hasOwnProperty("wordId")||(publicDictionary.words[w].wordId=w+1),D+=PublicDictionaryEntry(w),g++);else D="There are no entries in the dictionary.";h.innerHTML=D,ShowFilterWordCount(g)}else document.getElementById("dictionaryContainer").innerHTML=publicDictionary}function PublicDictionaryEntry(e){var i="<entry><a name='"+publicDictionary.words[e].wordId+"'></a><a href='#"+publicDictionary.words[e].wordId+"' class='wordLink clickable'>&#x1f517;</a>",t=regexParseForSearch(document.getElementById("searchBox").value),n=document.getElementById("searchOptionWord").checked,r=document.getElementById("searchOptionSimple").checked,c=document.getElementById("searchOptionLong").checked,o=!document.getElementById("searchCaseSensitive").checked,a=document.getElementById("searchIgnoreDiacritics").checked,d=new RegExp("("+(a?removeDiacritics(t)+"|"+t:t)+")","g"+(o?"i":""));return i+="<word>",i+=""!=t&&n?htmlEntitiesParse(publicDictionary.words[e].name).replace(d,"<searchTerm>$1</searchterm>"):publicDictionary.words[e].name,i+="</word>",""!=publicDictionary.words[e].pronunciation&&(i+="<pronunciation>",i+=marked(htmlEntitiesParse(publicDictionary.words[e].pronunciation)).replace("<p>","").replace("</p>",""),i+="</pronunciation>"),""!=publicDictionary.words[e].partOfSpeech&&(i+="<partofspeech>",i+=publicDictionary.words[e].partOfSpeech,i+="</partofspeech>"),i+="<br>",""!=publicDictionary.words[e].simpleDefinition&&(i+="<simpledefinition>",i+=""!=t&&r?htmlEntitiesParse(publicDictionary.words[e].simpleDefinition).replace(d,"<searchTerm>$1</searchterm>"):publicDictionary.words[e].simpleDefinition,i+="</simpledefinition>"),""!=publicDictionary.words[e].longDefinition&&(i+="<longdefinition>",i+=""!=t&&c?marked(htmlEntitiesParse(publicDictionary.words[e].longDefinition).replace(d,"<searchTerm>$1</searchterm>")):marked(htmlEntitiesParse(publicDictionary.words[e].longDefinition)),i+="</longdefinition>"),i+="</entry>"}function SetPublicPartsOfSpeech(){for(var e=document.getElementById("wordFilter"),i=htmlEntitiesParse(publicDictionary.settings.partsOfSpeech).trim().split(","),t=0;t<i.length;t++){var n=document.createElement("option");n.appendChild(document.createTextNode(i[t].trim())),n.value=i[t].trim(),e.appendChild(n)}}