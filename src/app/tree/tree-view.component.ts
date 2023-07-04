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
  @Input() openToFieldSubject: Subject<number | string>;

  @Input() trackBy: (i: number, item: T) => unknown =
    TreeViewComponent._defaultTrackBy;

  expandedNodes = new Set<string>();

  index = 0;

  private readonly _check$ = new BehaviorSubject<TreeMultidimensionalArray<T>>(
    []
  );

  private static _defaultTrackBy = (index: number) => index;

  readonly nodes$: Observable<TreeMultidimensionalQuikArray<T>> =
    this._check$.pipe(
      tap(() => console.log('distinctUntilChanged')),
      distinctUntilChanged((prev, curr) => {
        return JSON.stringify(prev) === JSON.stringify(curr);
      }),
      map((nodes) => {
        this.index = 0;
        return this.prepareNodesToQuikTreeModal(nodes);
      }),
      tap(() => console.log('updated'))
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
    // this.collapseAllSubject.subscribe(() => this.collapseAll());
    // this.expandAllSubject.subscribe(() => this.expandAll());
    // // this.openToFieldSubject.subscribe(() => this.expan);
    // if (!!this.expanded) {
    //   this.expandAll();
    // }
    // this.openToFieldSubject.subscribe((fieldValue) => {
    //   this.openToNode(fieldValue);
    // });
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
