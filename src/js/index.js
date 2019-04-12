import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

const state = {};

/* SEARCH CONTROLLER */
const controlSearch = async () => {
  const query = searchView.getInput();

  // new search object and add to state
  state.search = new Search(query);
  
  // prepare ui for search results
  searchView.clearInput();
  searchView.clearResults();
  renderLoader(elements.searchRes);
  
  try {
    // search for recipes
    await state.search.getResults();

    // render results in ui
    clearLoader();
    searchView.renderResults(state.search.results)

  } catch(error) {
    console.log(error)
    alert('something went wrong while searching');
    clearLoader();
  }
}

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.results, goToPage);
  }
});


/*********************/
/* RECIPE CONTROLLER */

const controlRecipe = async () => {
  // get ID from url
  const id = window.location.hash.replace('#','');

  if (id) {
    // prepare ui for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    // create new recipe object and parse ingredients
    state.recipe = new Recipe(id);

    try {
      // get recipe data
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();
  
      // calculate time and servings
      state.recipe.calcTime();
      state.recipe.calcServings();
  
      // render recipe
      clearLoader();
      recipeView.renderRecipe(
        state.recipe,
        state.likes.isLiked(id)
      );

    } catch(error) {
      alert('error processing recipe');
    }

  };
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/*******************/
/* LIST CONTROLLER */

const controlList = () => {
  // create new list if there isn't one already
  if (!state.list) state.list = new List();

  // add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  })
}

// handle delete and update list item events
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  // handle delete
  if (e.target.matches('.shopping__delete, .shopping__delete *')) {
    // delete from state
    state.list.deleteItem(id);

    // delete from ui
    listView.deleteItem(id);

    // handle count update
  } else if (e.target.matches('.shopping__count--value')) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});


/********************/
/* LIKES CONTROLLER */

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  // user has not liked current recipe
  if (!state.likes.isLiked(currentID)) {
    // add like to state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    // toggle like button
    likesView.toggleLikeBtn(true);

    // add like to ui list
    likesView.renderLike(newLike);

  // user has already liked current recipe
  } else {
    // remove like from state
    state.likes.deleteLike(currentID);

    // toggle like button
    likesView.toggleLikeBtn(false);
    
    // remove like from ui list
    likesView.deleteLike(currentID);

  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// restore liked recipes on page reload
window.addEventListener('load', () => {
  state.likes = new Likes();

  // restore likes
  state.likes.readStorage();

  // toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  // render existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});


// handling recipe serving button clicks
elements.recipe.addEventListener('click', e => {
  if (e.target.matches('.btn-decrease, .btn-decrease *')) {
    if (state.recipe.servings > 1) {
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches('.btn-increase, .btn-increase *')) {
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
    // add ingredients to shopping list
    controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    // like controller
    controlLike();
  }
});

