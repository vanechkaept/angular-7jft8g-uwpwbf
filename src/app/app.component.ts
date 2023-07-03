import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Subject } from 'rxjs';
import { TreeMultidimensionalArray } from './com/com.component';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent<T> {
  collapseAll = new Subject<void>();
  expandAll = new Subject<void>();
  i = 7;
  nodes: Lists = [
    {
      id: '1',
      label: '1',
    },
    {
      id: '2',
      label: 'Second',
      child: [
        {
          id: '3',
          label: 'Third',
        },
        {
          id: '4',
          label: '4',
          child: [
            {
              id: '5',
              label: '5',
            },
          ],
        },
      ],
    },
    {
      id: '6',
      label: '6',
      child: [],
    },
  ];

  addNode(nodes: Lists = this.nodes): void {
    nodes.push({
      id: this.i + '',
      label: this.i + '',
    });

    this.i++;
  }

  emit(subject: Subject<void>) {
    subject.next();
  }
}

type Lists = TreeMultidimensionalArray<{ id: string; label: string }>;
