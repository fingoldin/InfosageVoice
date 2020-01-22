"use strict";

const infosageService = require("./infosageService.js");

const LIFESPAN = 4;

const internalError = (c) => {
  c.clearOutgoingContexts();
  c.add("There was an internal error. Please try again");
}

const printBrands = (brands, start = 0, max = -1) => {
  let res = "";
  if(max === -1) {
    max = brands.length;
  }
  for(let idx = start; idx < brands.length && idx < start + max; idx++) {
    res += (idx + 1) + ": " + brands[idx].name + ".";
    if(idx < brands.length - 1 && idx < start + max - 1) {
      res += " ";
    }
  }
  return res;
}

const findBrand = (brands, brandName) => {
  let idx = -1;
  for(let i = 0; i < brands.length; i++) {
    if(brands[i].name == brandName) {
      idx = i;
      break;
    }
  }
  return idx;
}

const findForm = (formUnits, configuration) => {
  return -1;
}

const printForm = (form) => {
  let res = "";
  for(let i = 0; i < form.units.length; i++) {
    let unit = form.units[i];
    res += unit.name + " " + unit.amount + " " + unit.unit;
    if(unit.volume) {
      res += "/" + unit.unitvolume
    }
    if(i < form.units.length - 1) {
      res += " / ";
    }
  }
  if(form.configuration) {
    res += " " + form.configuration;
  }
  return res;
}

const printForms = (forms) => {
  let res = "";
  for(let i = 0; i < forms.length; i++) {
    res += (i + 1) + ": " + printForm(forms[i]) + ".";
    res += " ";
  }
  return res;
}

const checkRequiredAddParams = (c, info, prefix="") => {
  if(info.drugInfo.brands.length === 1) {
    if(info.drugInfo.brands[0].forms.length === 1) {
      c.context.set({ name: "addmedication-followup", parameters: {
        name: info.name,
        'name.original': info['name.original'],
        brand: info.drugInfo.brands[0].name,
        'brand.original': info.drugInfo.brands[0].name,
        formUnits: info.drugInfo.brands[0].forms[0].units,
        'formUnits.original': printForm({ units: info.drugInfo.brands[0].forms[0].units }),
        configuration: info.drugInfo.brands[0].forms[0].configuration,
        'configuration.original': info.drugInfo.brands[0].forms[0].configuration,
        drugInfo: info.drugInfo
      } });
      c.context.set({ name: "adding_medication_dosage", lifespan: LIFESPAN });
      c.add(prefix + "What is the medication dosage?");
    } else {
      c.context.set({ name: "addmedication-followup", parameters: {
        name: info.name,
        'name.original': info['name.original'],
        brand: info.drugInfo.brands[0].name,
        'brand.original': info.drugInfo.brands[0].name,
        drugInfo: info.drugInfo
      } });
      c.context.set({ name: "adding_medication_form", lifespan: LIFESPAN });
      c.add(prefix + "What is the medication form?");
    }
  } else {
    c.context.set({ name: "adding_medication_brand", lifespan: LIFESPAN });
    c.add(prefix + "What is the medication brand?");
  }
}

const checkRequiredAddParamsBrand = (c, info, brandInfo, prefix="") => {
  if(brandInfo.forms.length === 1) {
    c.context.set({ name: "addmedication-followup", parameters: {
      name: info.name,
      'name.original': info['name.original'],
      brand: info.brand,
      'brand.original': info['brand.original'],
      formUnits: brandInfo.forms[0].units,
      'formUnits.original': printForm(brandInfo.forms[0]),
      configuration: brandInfo.forms[0].configuration,
      'configuration.original': brandInfo.forms[0].configuration,
      drugInfo: info.drugInfo
    } });
    c.context.set({ name: "adding_medication_dosage", lifespan: LIFESPAN });
    c.add(prefix + "What is the medication dosage?");
  } else  {
    c.context.set({ name: "adding_medication_form", lifespan: LIFESPAN });
    c.add(prefix + "What is the medication form?");
  }
}

const intents = {
  "Add Medication": (c) => {
    c.context.set({ name: "adding_medication_name", lifespan: LIFESPAN });
    c.add("What is the name of the medication?");
  },
  "Add Medication - custom": (c) => {
    c.add("");
    c.setFollowupEvent("add_custom_medication");
  },
  "Add Medication - name": (c) => {
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }

    if(!info.name || !info.name.length) {
      c.add("What is the medication name?");
    } else {
      infosageService.get("drugInfo/", { name: info.name }).then((drugInfo) => {
        // drugInfo is an array sorted by the length of the name array, from small to large,
        // with the first element being the perfect match
        if(!drugInfo || !drugInfo.length) {
          c.add("We couldn't find any information on " + info['name.original'].join(" ") +
                ". Would you like to add this as a custom record or enter the name again?");
        } else {
          c.context.set({ name: "addmedication-followup", parameters: {
            name: info.name,
            'name.original': info['name.original'],
            drugInfo: drugInfo[0]
          } });

          if(drugInfo.length > 1) {
            c.add("Are there any other components to your medication? For example, instead of " +
                  info['name.original'].join(" ") + ", you could have " + drugInfo[1].name.join(" "));
            c.context.set({ name: "adding_medication_name_append", lifespan: LIFESPAN });
          } else {
            c.context.delete("addmedication-name-followup");
            checkRequiredAddParams(c, info);
          }
        }
      }, (err) => {
        internalError(c);
      });
    }
  },
  "Add Medication - name - append yes": (c) => {
    console.log("Append yes");
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }
    
    let newName = [ ...info['name.original'], ...info['nameAppend.original'] ];

    infosageService.get("drugInfo/", { name: newName }).then((drugInfo) => {
      // drugInfo is an array sorted by the length of the name array, from small to large,
      // with the first element being the perfect match
      if(!drugInfo || !drugInfo.length) {
        c.add("We couldn't find any information on " + newName.join(" ") +
              ". Would you like to add this as a custom record or enter the name again?");
      } else {
        c.context.set({ name: "addmedication-followup", parameters: {
          name: [ ...info.name, ...info.nameAppend ],
          'name.original': newName,
          drugInfo: info.drugInfo[0]
        } });

        c.add("Ok, your medication is " + newName.join(" ") + ". Is this correct?");
      }
    }, (err) => {
      internalError(c);
    });
  },
  "Add Medication - name - append yes - yes": (c) => {
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }
    checkRequiredAddParams(c, info, "Ok. ");
  },
  "Add Medication - name - no": (c) => {
    if(c.context.get("addmedication-name-appendyes-followup")) {
      c.context.set({ name: "adding_medication_name", lifespan: LIFESPAN });
      c.add("Ok. Please tell me the name of your medication again.");
    } else {
      let info = c.context.get("addmedication-followup");
      if(!info) {
        return internalError(c);
      } else {
        info = info.parameters;
      }
      checkRequiredAddParams(c, info, "Ok. ");
    }
  },
  "Add Medication - name - repeat": (c) => {
    c.context.set({ name: "adding_medication_name", lifespan: LIFESPAN });
    c.add("Ok. Please tell me the name of your medication again.");
  },
  "Add Medication - brand": (c) => {
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }
    
    if(!info.brand) {
      c.add("");
      c.setFollowupEvent("add_medication_brand_list");
    } else {
      if(findBrand(info.drugInfo.brands, info.brand) === -1) {
        c.add("We couldn't find a brand name " + info['brand.original'] + " matching " +
              info['name.original'].join(" ") + ". Would you like me to list the " +
              "available brands, or would you like to add this as a custom record instead?");
      } else  {
        let brandIdx = findBrand(info.drugInfo.brands, info.brand);
        if(brandIdx === -1) {
          return internalError(c);
        }

        c.context.delete("addmedication-brand-followup");
        checkRequiredAddParamsBrand(c, info, info.drugInfo.brands[brandIdx]);
      }
    }
  },
  "Add Medication - brand - query list": (c) => {
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }

    c.add("There are " + info.drugInfo.brands.length + " available brands. They are " +
          printBrands(info.drugInfo.brands) + ". Which brand is your medication?");
    c.context.set({ name: "adding_medication_brand_number", lifespan: LIFESPAN });
    c.context.set({ name: "adding_medication_brand", lifespan: LIFESPAN });
  },
  "Add Medication - brand - yes": (c) => {
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }
    
    let brandIdx = findBrand(info.drugInfo.brands, info.brand);
    if(brandIdx === -1) {
      return internalError(c);
    }
    checkRequiredAddParamsBrand(c, info, info.drugInfo.brands[brandIdx]);
  },
  "Add Medication - brand - select.number": (c) => {
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }

    if(c.parameters.number >= 1 && c.parameters.number <= info.drugInfo.brands.length) {
      let brand = info.drugInfo.brands[c.parameters.number - 1].name;

      c.add("Are you sure you want to select the brand " + brand + "?");
      c.context.set({ name: "adding_medication_brand_confirm", lifespan: LIFESPAN });
    } else {
      c.add("That was an invalid number. Please choose between 1 and " + info.drugInfo.brands.length);
      c.context.set({ name: "adding_medication_brand_number", lifespan: LIFESPAN });
      c.context.set({ name: "adding_medication_brand", lifespan: LIFESPAN });
    }
  },
  "Add Medication - form": (c) => {
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }
    
    let brandIdx = findBrand(info.drugInfo.brands, info.brand);
    if(brandIdx === -1) {
      return internalError(c);
    }
    let forms = info.drugInfo.brands[brandIdx].forms;

    if(!c.parameters.formUnits || !c.parameters.formUnits.length) {
      c.add("What is the medication form? There are " + forms.length + " available forms for this brand");
    } else if(info.formUnits.length !== info.name.length) {
      c.add("You must provide as much form information as there are individual drugs " +
            "in your medication. You provided " + info.formUnits.length + " instead of the required " +
            info.name.length + " units of form information for " + info['name.original'].join(" ") +
            ". Please tell me the form again");
      c.context.set({ name: "add_medication_-_form_dialog_params_formunits", lifespan: 2 });
      c.context.delete("add_medication_-_form_dialog_params_configuration");
    } else if(!c.parameters.configuration) {
      c.add("What is the configuration of the medication? For example, oral tablet");
    } else {
      let brandIdx = findBrand(info.drugInfo.brands, info.brand);
      if(brandIdx === -1) {
        return internalError(c);
      }
      let formIdx = findForm(forms, info.formUnits, info.configuration);
      if(formIdx === -1) {
        c.add("We couldn't find information on the form " + info['formUnits.original'].join(" / ") + " " +
              info['configuration.original'] + " for the brand " + info['brand.original'] +
              ". I can list the available forms for this brand if you'd like, or you can add this" +
              " as a custom record.");
      } else {
        c.context.delete("addmedication-form-followup");
        c.context.set({ name: "adding_medication_dosage", lifespan: LIFESPAN });
        c.add("What is the medication dosage?");
      }
    }
  },
  "Add Medication - form - yes": (c) => {
    c.context.set({ name: "adding_medication_dosage", lifespan: LIFESPAN });
    c.add("What is the medication dosage?");
  },
  "Add Medication - form - query list": (c) => {
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }
    
    let brandIdx = findBrand(info.drugInfo.brands, info.brand);
    if(brandIdx === -1) {
      return internalError(c);
    }
    let forms = info.drugInfo.brands[brandIdx].forms;

    c.add("There are " + forms.length + " available forms. They are " +
          printForms(forms) + " In which form is your medication?");
    c.context.set({ name: "adding_medication_form_number", lifespan: LIFESPAN });
    c.context.set({ name: "adding_medication_form", lifespan: LIFESPAN });
  },
  "Add Medication - form - select.number": (c) => {
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }

    let brandIdx = findBrand(info.drugInfo.brands, info.brand);
    if(brandIdx === -1) {
      return internalError(c);
    }
    let forms = info.drugInfo.brands[brandIdx].forms;

    if(c.parameters.number >= 1 && c.parameters.number <= forms.length) {
      let form = forms[c.parameters.number - 1];

      c.add("Are you sure you want to select the form " + printForm(form));
      c.context.set({ name: "adding_medication_form_confirm", lifespan: LIFESPAN });
    } else {
      c.add("That was an invalid number. Please choose between 1 and " + forms.length);
      c.context.set({ name: "adding_medication_form_number", lifespan: LIFESPAN });
      c.context.set({ name: "adding_medication_form", lifespan: LIFESPAN });
    }
  },
  "Add Medication - dosage": (c) => {
    let info = c.context.get("addmedication-followup");
    if(!info) {
      return internalError(c);
    } else {
      info = info.parameters;
    }

    if(!c.parameters.dosage) {
      c.add("Please tell me the dosage");
    } else {
      c.add("Ok. Are you sure you want to add " + info['brand.original'] + " brand " + 
            info['name.original'] + " of form " + printForm({ 
              units: info.formUnits,
              configuration: info.configuration
            }) + " with a dosage of " + info['dosage.original'] + "?");
    }
  },
  "Add Medication - yes": (c) => {
    infosageService.post("add_medication", {
      name: c.parameters.name,
      brand: c.parameters.brand,
      dosage: c.parameters.dosage
    }).then(() => {
      c.add("The medication was added successfully");
    }, () => {
      internalError(c);
    });
  },
  "Add Custom Medication - yes": (c) => {
    infosageService.post("add_custom_medication", {
      name: c.parameters.name,
      dosage: c.parameters.dosage
    }).then(() => {
      c.add("The medication was added successfully");
    }, () => {
      internalError(c);
    });
  }
};

exports.getIntentMap = () => {
  let map = new Map();
  for(let intent in intents) {
    map.set(intent, intents[intent]);
  }

  return map;
}
