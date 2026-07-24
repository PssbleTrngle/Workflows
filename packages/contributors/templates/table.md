<table>
   <tbody>
      {{#each rows}}
      <tr>
         {{#each this}}
         <td align="center">
            <img src="{{{ avatar }}}" width="100;" alt="{{ name }}" />
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
