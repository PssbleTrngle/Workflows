<table>
   <tbody>
      {{#each rows}}
      <tr>
         {{#each this}}
         <td align="center">
            {{#if avatar}}
            <img src="{{{ avatar }}}" width="100;" alt="{{ name }}" />
            {{else}}
            <img src="https://placehold.net/avatar-4.svg" width="100;" alt="{{ name }}" />
            {{/if}}
            <br />
            {{#each links}}
            <a href="{{{ url }}}">
               <img src="{{{ icon }}}" width="20" alt="{{ name }}" title="{{ name }}" />
            </a>
            {{/each}}
            <br />
            <sub><b>{{ name }}</b></sub>
            {{#if description}}
            <br />
            <sub><small>{{ description }}</small></sub>
            {{/if}}
         </td>
         {{/each}}
      </tr>
      {{/each}}
   <tbody>
</table>
