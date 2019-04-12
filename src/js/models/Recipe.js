import axios from 'axios';
import {proxy, key} from '../config';

export default class Recipe {
  constructor(id) {
    this.id = id;
  }

  async getRecipe() {
    try {
      const res = await axios(`${proxy}https://www.food2fork.com/api/get?key=${key}&rId=${this.id}`);
      this.title = res.data.recipe.title;
      this.author = res.data.recipe.publisher;
      this.img = res.data.recipe.image_url;
      this.url = res.data.recipe.source_url;
      this.ingredients = res.data.recipe.ingredients;
    } catch(error) {
      console.log(error);
    }
  }
  

  calcTime() {
    // assuming that 15min are required for every three ingredients
    const numIng = this.ingredients.length;
    const periods = Math.ceil(numIng / 3);
    this.time = periods * 15;
  }

  calcServings() {
    this.servings = 4;
  }

  parseIngredients() {
    const unitLong = ['tablespoons', 'tablespoon', 'teaspoons', 'teaspoon', 'ounces', 'ounce ', 'cups', 'pounds'];
    const unitShort = ['tbsp', 'tbsp', 'tsp', 'tsp', 'oz', 'oz ', 'cup', 'pound'];
    const units = [...unitShort, 'kg', 'g'];
    
    const newIngredients = this.ingredients.map(el => {
      // unify units
      let ingredient = el.toLowerCase();
      unitLong.forEach((unit, i) => {
        ingredient = ingredient.replace(unit, unitShort[i]);
      });
      
      // remove parentheses
      ingredient = ingredient.replace(/ *\([^)]*\) */g, " ");

      // parse ingredients into individual count, unit, and ingredient
      const arrIng = ingredient.split(' ');
      const unitIndex = arrIng.findIndex(el2 => units.includes(el2));
      
      let objIng;
      if (unitIndex > -1) {
        // there is a unit
        // 4 1/2 cups, arrCount is ['4', '1/2'] --> eval("4+1/2") --> 4.5
        // 4 cups, arrCount is ['4']
        const arrCount = arrIng.slice(0, unitIndex);

        let count;
        if (arrCount.length === 1) {
          count  = eval(arrIng[0].replace('-', '+'));
        } else {
          count = eval(arrIng.slice(0, unitIndex).join('+'));
        }

        objIng = {
          count,
          unit: arrIng[unitIndex],
          ingredient: arrIng.slice(unitIndex + 1).join(' ')
        };

      } else if (parseInt(arrIng[0], 10)) {
        // this is no unit but the first element is a number
        objIng = {
          count: parseInt(arrIng[0], 10),
          unit: '',
          ingredient: arrIng.slice(1).join(' ')
        }

      } else if (unitIndex === -1) {
        // there is no unit and not number in the first position
        objIng = {
          count: 1,
          unit: '',
          ingredient // shorthand for "ingredient: ingredient "
        }
      }

      return objIng;
    });
    this.ingredients = newIngredients;
  }

  updateServings(type) {
    // servings
    const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;

    //ingredients
    this.ingredients.forEach(ing => {
      ing.count *= (newServings / this.servings);
    });

    this.servings = newServings;
  };
  
}