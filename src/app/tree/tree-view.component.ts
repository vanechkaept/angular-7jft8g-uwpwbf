import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  TemplateRef,
} from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs/internal/Rx';
import { distinctUntilChanged, map, startWith, tap } from 'rxjs/operators';

@Component({
  selector: 'my-tree-view',
  templateUrl: './tree-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeViewComponent<T> {
  @Input() nodes!: TreeMultidimensionalArray<T>;
  @Input() selectable = false;
  @Input() level = 0;
  @Input() childKey: keyof T | 'child' = 'child';
  @Input() showBorder = false;
  @Input() expandAllSubject = new Subject<void>();
  @Input() collapseAllSubject = new Subject<void>();
  @Input() expanded: boolean | null = false;
  @Input() content!: TemplateRef<unknown>;
  @Input() pseudoChild: TemplateRef<unknown> | undefined;
  @Input() canHover = true;
  /** Stretch content */
  @Input() stretchContent = false;
  // unique key from nodes
  @Input() uniqueField: keyof T;
  // доработать как примитив, будут отправяться значение уникального поля
  @Input() openToFieldSubject: Subject<number>;

  @Input() trackBy: (i: number, item: T) => unknown =
    TreeViewComponent._defaultTrackBy;

  expandedNodes = new Set<number>();

  index = 0;

  _nodes: TreeMultidimensionalQuikArray<T> = [];

  private readonly _check$ = new BehaviorSubject<TreeMultidimensionalArray<T>>(
    []
  );

  private static _defaultTrackBy = (index: number) => index;

  readonly nodes$: Observable<TreeMultidimensionalQuikArray<T>> =
    this._check$.pipe(
      tap(() => console.log('distinctUntilChanged TreeViewComponent')),
      distinctUntilChanged((prev, curr) => {
        return JSON.stringify(prev) === JSON.stringify(curr);
      }),
      map((nodes) => {
        this.index = 0;
        return this.prepareNodesToQuikTreeModal(nodes);
      }),
      tap((nodes) => {
        this._nodes = nodes;
        console.log('updated TreeViewComponent');
      })
    );

  constructor(private _cdr: ChangeDetectorRef) {}

  ngDoCheck(): void {
    this.checkChanges();
  }

  private prepareNodesToQuikTreeModal(
    nodes: TreeMultidimensionalArray<T>
  ): TreeMultidimensionalQuikArray<T> {
    return nodes.map((item) => {
      const newItem = {
        ...item,
        quikTreeId: this.index,
      } as TreeMultidimensionalQuik<T>;
      this.index++;

      const childrens = this.getChildNodes(item);
      // Если у элемента есть дочерние узлы, рекурсивно вызываем функцию для них
      if (childrens?.length) {
        (newItem as any)[this.childKey] =
          this.prepareNodesToQuikTreeModal(childrens);
      }

      return newItem;
    });
  }

  getChildNodes<K>(
    node: TreeMultidimensional<T>
  ): TreeMultidimensionalArray<T> | undefined {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return node[this.childKey] || undefined;
  }

  checkChanges(): void {
    const d = JSON.parse(JSON.stringify(this.nodes));
    this._check$.next(d);
    // this.item?.checkChanges();
    // this.child?.checkChanges();
  }

  ngOnInit() {
    this.collapseAllSubject.subscribe(() => {
      this.expandedNodes.clear();
      this._cdr.markForCheck();
    });

    this.expandAllSubject.subscribe(() => {
      for (let i = 0; this.index > i; i++) {
        this.expandedNodes.add(i);
      }
      this._cdr.markForCheck();
    });

    this.openToFieldSubject?.subscribe((value) => {
      const d = this.getQuikTreeIdsById(value, this._nodes);
    });
  }

  getQuikTreeIdsById<T>(
    id: number,
    data: TreeMultidimensionalQuikArray<T>
  ): number[] | null {
    const result: number[] = [];

    function findQuikTreeIds(
      item: TreeMultidimensionalQuikArray<T>,
      parentId: number
    ): boolean {
      for (let i = 0; i < item.length; i++) {
        const currentItem = item[i] as any;

        if (currentItem.id === id) {
          result.push(currentItem.quikTreeId);
          return true;
        }

        const childNodes = this.getChildNodes(currentItem);
        const currentQuikTreeId = currentItem.quikTreeId;

        if (childNodes && childNodes.length > 0) {
          result.push(currentQuikTreeId);
          if (findQuikTreeIds(childNodes, currentQuikTreeId)) {
            return true;
          }
          result.pop();
        }
      }

      return false;
    }

    if (findQuikTreeIds(data, 0)) {
      return result;
    }

    return null;
  }
}

export type TreeMultidimensionalArray<T, K extends string = 'child'> = Array<
  TreeMultidimensional<T, K>
>;

export type TreeMultidimensional<T, K extends string = 'child'> = T & {
  [P in K]?: TreeMultidimensionalArray<T, K>;
};

export type TreeMultidimensionalQuikArray<
  T,
  K extends string = 'child'
> = Array<TreeMultidimensionalQuik<T, K>>;

export type TreeMultidimensionalQuik<T, K extends string = 'child'> = T & {
  [P in K]?: TreeMultidimensionalQuikArray<T, K>;
} & { quikTreeId: number };

// function getQuikTreeIdsById<T>(
//   id: string,
//   data: TreeMultidimensionalQuikArray<T>
// ): number[] | null {
//   const result: number[] = [];

//   function findQuikTreeIds(
//     item: TreeMultidimensionalQuikArray<T>,
//     parentId: number
//   ): boolean {
//     for (let i = 0; i < item.length; i++) {
//       const currentItem = item[i] as any;

//       if (currentItem.id === id) {
//         result.push(currentItem.quikTreeId);
//         return true;
//       }

//       const childNodes = currentItem.child;
//       const currentQuikTreeId = currentItem.quikTreeId;

//       if (childNodes && childNodes.length > 0) {
//         result.push(currentQuikTreeId);
//         if (findQuikTreeIds(childNodes, currentQuikTreeId)) {
//           return true;
//         }
//         result.pop();
//       }
//     }

//     return false;
//   }

//   if (findQuikTreeIds(data, 0)) {
//     return result;
//   }

//   return null;
// }
