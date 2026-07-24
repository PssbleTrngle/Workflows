<table>
   <tbody>
      {{#each rows}}
      <tr>
         {{#each this}}
         <td align="center">
            <a href="https://github.com/{{ githubUser }}">
               <img src="{{{ avatar }}}" width="100;" alt="{{ githubUser }}" />
               <br />
               <sub><b>{{ name }}</b></sub>
               {{#if description}}
               <br />
               <sub><small>{{ description }}</small></sub>
               {{/if}}
            </a>
         </td>
         {{/each}}
      </tr>
      {{/each}}
   <tbody>
</table>