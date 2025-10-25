import Handlebars from "handlebars";

export default {
  var: (text: string) => new Handlebars.SafeString("${{" + text + "}}"),
};
