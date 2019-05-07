import { renderWords } from "./render";
import { wordExists } from "./utilities";
import removeDiacritics from "./StackOverflow/removeDiacritics";
import { removeTags } from "../helpers";

export function validateWord(word, wordId = false) {
  const errorElementId = wordId === false ? 'wordErrorMessage' : 'wordErrorMessage_' + wordId,
    errorElement = document.getElementById(errorElementId);
  let errorMessage = '';
  
  if (word.name === '') {
    errorMessage += '<p class="bold red">Word field must not be blank.</p>';
  }
  if (word.simpleDefinition === '' && word.longDefinition === '') {
    errorMessage += '<p class="bold red">You must enter Definition or Details.</p>';
  }

  const { allowDuplicates, caseSensitive } = window.currentDictionary.settings;
  if (!allowDuplicates) {
    const foundDuplicate = wordExists(word.name, true);
    if (foundDuplicate !== false) {
      if (wordId !== false && foundDuplicate !== wordId) {
        errorMessage += `<p class="bold red">"<a href="#${foundDuplicate}">${word.name}</a>" already exists, and "Prevent Duplicate Words" is turned on.${!caseSensitive ? ' <em>(Case sensitivity is turned off)</em>' : ''}</p>`;
      }
    }
  }

  errorElement.innerHTML = errorMessage;
  return errorMessage === '';
}

export function sortWords(render) {
  const { sortByDefinition } = window.currentDictionary.settings;
  const sortBy = sortByDefinition ? 'simpleDefinition' : 'name';

  window.currentDictionary.words.sort((wordA, wordB) => {
    if (removeDiacritics(wordA[sortBy]).toLowerCase() === removeDiacritics(wordB[sortBy]).toLowerCase()) return 0;
    return removeDiacritics(wordA[sortBy]).toLowerCase() > removeDiacritics(wordB[sortBy]).toLowerCase() ? 1 : -1;
  });

  if (render) {
    renderWords();
  }
}

export function addWord(word, render = true) {
  window.currentDictionary.words.push(word);
  sortWords(render);
}

export function updateWord(word, wordId) {
  const wordIndex = window.currentDictionary.words.findIndex(word => word.wordId === wordId);

  if (wordIndex < 0) {
    console.error('Could not find word to update');
  } else {
    window.currentDictionary.words[wordIndex] = word;
    sortWords(true);
  }
}

export function confirmEditWord() {
  const button = this;
  const wordId = parseInt(button.id.replace('editWordButton_', ''));
  const name = document.getElementById('wordName_' + wordId).value,
    pronunciation = document.getElementById('wordPronunciation_' + wordId).value,
    partOfSpeech = document.getElementById('wordPartOfSpeech_' + wordId).value,
    definition = document.getElementById('wordDefinition_' + wordId).value,
    details = document.getElementById('wordDetails_' + wordId).value;

  const word = {
    name: removeTags(name).trim(),
    pronunciation: removeTags(pronunciation).trim(),
    partOfSpeech: removeTags(partOfSpeech).trim(),
    simpleDefinition: removeTags(definition).trim(),
    longDefinition: removeTags(details).trim(),
    wordId,
  };

  if (validateWord(word, wordId)) {
    if (confirm(`Are you sure you want save changes to ${word.name}?`)) {
      updateWord(word, wordId);
    }
  }
}