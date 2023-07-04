import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  TemplateRef,
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs/internal/Rx';
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

  readonly randomColor = 'rgb(var(--color-on-background), .1)';

  private _expandedNodes = new Set<string>();

  private readonly _check$ = new BehaviorSubject<TreeMultidimensionalArray<T>>(
    []
  );

  private static _defaultTrackBy = (index: number) => index;

  readonly nodes$ = this._check$.pipe(
    tap(() => console.log('distinctUntilChanged')),
    distinctUntilChanged((prev, curr) => {
      return JSON.stringify(prev) === JSON.stringify(curr);
    }),
    tap(() => console.log('updated'))
  );

  constructor(private _cdr: ChangeDetectorRef) {}

  ngDoCheck(): void {
    this.checkChanges();
  }

  checkChanges(): void {
    const d = JSON.parse(JSON.stringify(this.nodes));
    this._check$.next(d);
    // this.item?.checkChanges();
    // this.child?.checkChanges();
  }

  ngOnInit() {
    this.collapseAllSubject.subscribe(() => this.collapseAll());
    this.expandAllSubject.subscribe(() => this.expandAll());
    // this.openToFieldSubject.subscribe(() => this.expan);

    if (!!this.expanded) {
      this.expandAll();
    }

    this.openToFieldSubject.subscribe((fieldValue) => {
      this.openToNode(fieldValue);
    });
  }

  // openToField(searchebleFiled: number | string){
  //   this.nodes.forEach(node => {
  //     const child = this.getChildNodes(node);

  //   })
  // }

  @HostBinding('class')
  get levelClass() {
    return `level-${this.level}`;
  }

  getChildNodes(
    nodes: TreeMultidimensional<T>
  ): TreeMultidimensionalArray<T> | undefined {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return nodes[this.childKey] || undefined;
  }

  toggleNode(nodes: TreeMultidimensional<T>) {
    const nodeWithoutChildren = this._getNodeWithoutChildren(nodes);

    if (this.nodeExpanded(nodeWithoutChildren)) {
      this._expandedNodes.delete(JSON.stringify(nodeWithoutChildren));
    } else {
      this._expandedNodes.add(JSON.stringify(nodeWithoutChildren));
    }
  }

  nodeExpanded(node: TreeMultidimensional<T>): boolean {
    const nodeWithoutChildren = this._getNodeWithoutChildren(node);
    return this._expandedNodes.has(JSON.stringify(nodeWithoutChildren));
  }

  expandAll() {
    for (const node of this.nodes) {
      if (!this.nodeExpanded(node)) {
        const nodeWithoutChildren = this._getNodeWithoutChildren(node);
        this._expandedNodes.add(JSON.stringify(nodeWithoutChildren));
      }
    }
    this._cdr.markForCheck();
  }

  collapseAll() {
    this._expandedNodes.clear();
    this._cdr.markForCheck();
  }

  private _getNodeWithoutChildren(
    node: TreeMultidimensional<T>
  ): TreeMultidimensional<T> {
    const nodeWithoutChildren: TreeMultidimensional<T> = { ...node };
    if ((nodeWithoutChildren as never)[this.childKey]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete nodeWithoutChildren[this.childKey];
    }
    return nodeWithoutChildren;
  }

  //////////////////

  private openToNode(fieldValue: number | string) {
    const flattenedNodes: TreeMultidimensionalArray<T> = this.flattenTree(
      this.nodes
    );
    const node = flattenedNodes.find(
      (item) => (item[this.uniqueField] as any) === fieldValue
    );

    if (node) {
      const pathToNode = this.getPathToNode(flattenedNodes, node);
      this.expandPath(pathToNode);
    }
  }

  private flattenTree(
    nodes: TreeMultidimensionalArray<T>
  ): TreeMultidimensionalArray<T> {
    let flattenedNodes: TreeMultidimensional<T>[] = [];

    for (const node of nodes) {
      flattenedNodes.push(node);

      const childNodes = this.getChildNodes(node);
      if (childNodes) {
        flattenedNodes = flattenedNodes.concat(this.flattenTree(childNodes));
      }
    }

    return flattenedNodes;
  }

  private getPathToNode(
    flattenedNodes: TreeMultidimensional<T>[],
    node: TreeMultidimensional<T>
  ): TreeMultidimensional<T>[] {
    const path: TreeMultidimensional<T>[] = [];
    let currentNode: TreeMultidimensional<T> | undefined = node;

    while (currentNode) {
      path.unshift(currentNode);
      const parentNode = flattenedNodes.find(
        (item) => item[this.uniqueField] === currentNode![this.childKey]
      );
      currentNode = parentNode;
    }

    return path;
  }

  private expandPath(path: TreeMultidimensional<T>[]) {
    this.collapseAll();

    for (const node of path) {
      const nodeWithoutChildren = this._getNodeWithoutChildren(node);
      this._expandedNodes.add(JSON.stringify(nodeWithoutChildren));
    }
  }
}

export type TreeMultidimensional<T> = T & {
  child?: TreeMultidimensionalArray<T>;
};
export type TreeMultidimensionalArray<T> = Array<TreeMultidimensional<T>>;

function removeKeyFromObject<T>(
  a: TreeMultidimensional<T>,
  b: keyof T | 'child'
) {
  if (typeof a === 'object' && typeof b === 'string') {
    const { [b]: removedKey, ...updatedObject } = a;
    return updatedObject;
  } else {
    return a;
  }
}
