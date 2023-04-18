import { Message } from '@arco-design/web-react';
import { useRequest } from 'ahooks';
import { flushSync } from 'react-dom';

import { getTotalAPI } from '@/utils/apis/getTotal';
import { getWhereOrderPageDataAPI } from '@/utils/apis/getWhereOrderPageData';
import { defaultPageSize, failText, staleTime, visitorText } from '@/utils/constant';
import { DB } from '@/utils/dbConfig';

import { addDataAPI } from '../apis/addData';
import { deleteDataAPI } from '../apis/deleteData';
import { updateDataAPI } from '../apis/updateData';
import { _, isAdmin } from '../cloudBase';
import { dataMap } from '../dataMap';
import {
  getAfterDeletedPage,
  getTotalPage,
  myClearCache,
  myClearCacheOnePage
} from '../functions';

export interface DataFilterProps {
  text: string;
  data: string | string[];
  setData: any;
  reSet: any;
  require: boolean;
}

interface Props {
  DBName: DB;
  dataFilter?: DataFilterProps[];
  page: number;
  setPage: (page: number) => void;
  modalCancel?: () => void;
  sortKey?: string;
  isAsc?: boolean;
  pageSize?: number;
  where?: object;
}

export interface DeleteProps {
  page: number;
  setPage: (page: number) => void;
}

// 获取表格数据（data & total）
export const useTableData = ({
  DBName,
  dataFilter,
  page,
  setPage,
  modalCancel,
  sortKey = 'date',
  isAsc = false,
  pageSize = defaultPageSize,
  where = {}
}: Props) => {
  const {
    data,
    loading: dataLoading,
    run: dataRun
  } = useRequest(
    () =>
      getWhereOrderPageDataAPI({
        dbName: DBName,
        sortKey,
        isAsc,
        page,
        size: pageSize,
        where
      }),
    {
      retryCount: 3,
      refreshDeps: [page],
      cacheKey: `${DBName}-${JSON.stringify(where)}-data-${page}`,
      staleTime
    }
  );

  const {
    data: total,
    loading: totalLoading,
    run: totalRun
  } = useRequest(() => getTotalAPI({ dbName: DBName, where }), {
    retryCount: 3,
    cacheKey: `${DBName}-${JSON.stringify(where)}-total`,
    staleTime
  });

  const handleDelete = (id: string, { page, setPage }: DeleteProps) => {
    if (!isAdmin()) {
      Message.warning(visitorText);
      return;
    }
    deleteDataAPI(DBName, id).then(res => {
      if (!res.success && !res.permission) {
        Message.warning(visitorText);
      } else if (res.success && res.permission) {
        Message.success('删除成功！');
        flushSync(() =>
          myClearCache({
            key: `${DBName}-${JSON.stringify(where)}`,
            page,
            totalPage: getTotalPage(total?.total || 0, pageSize),
            deleteTotal: true
          })
        );
        flushSync(() => setPage(getAfterDeletedPage(total.total, page, pageSize)));
        flushSync(() => {
          dataRun();
          totalRun();
        });
      } else {
        Message.warning(failText);
      }
    });
  };

  const addData = (data: object) => {
    addDataAPI(DBName, data).then(res => {
      if (!res.success && !res.permission) {
        Message.warning(visitorText);
      } else if (res.success && res.permission) {
        Message.success('添加成功！');
        modalCancel?.();
        flushSync(() =>
          myClearCache({
            key: `${DBName}-${JSON.stringify(where)}`,
            page: 1,
            totalPage: getTotalPage(total?.total || 0, pageSize),
            deleteTotal: true
          })
        );
        flushSync(() => setPage(1));
        flushSync(() => {
          dataRun();
          totalRun();
        });
      } else {
        Message.warning(failText);
      }
    });
  };

  const editData = ({
    id,
    data,
    page,
    isClearAll
  }: {
    id: string;
    data: object;
    page: number;
    isClearAll: boolean;
  }) => {
    updateDataAPI(DBName, id, data).then(res => {
      if (!res.success && !res.permission) {
        Message.warning(visitorText);
      } else if (res.success && res.permission) {
        Message.success('修改成功！');
        modalCancel?.();
        flushSync(() => {
          isClearAll
            ? myClearCache({
                key: `${DBName}-${JSON.stringify(where)}`,
                page: 1,
                totalPage: getTotalPage(total?.total || 0, pageSize),
                deleteTotal: false
              })
            : myClearCacheOnePage(`${DBName}-${JSON.stringify(where)}`, page);
        });
        flushSync(() => {
          dataRun();
        });
      } else {
        Message.warning(failText);
      }
    });
  };

  const modalOk = ({
    isEdit,
    id,
    data,
    page,
    isClearAll = false
  }: {
    isEdit: boolean;
    id: string;
    data: object;
    page: number;
    isClearAll?: boolean;
  }) => {
    if (
      dataFilter?.some(
        ({ data: filterData, require }) =>
          require && (!filterData || (Array.isArray(filterData) && !filterData.length))
      )
    ) {
      Message.info(`请输入完整${dataMap[DBName as keyof typeof dataMap]}信息！`);
      return;
    }
    if (!isAdmin()) {
      Message.warning(visitorText);
      return;
    }
    isEdit ? editData({ id, data, page, isClearAll }) : addData(data);
  };

  return {
    data: data?.data,
    total: total?.total,
    loading: dataLoading || totalLoading,
    handleDelete,
    modalOk,
    dataRun,
    totalRun
  };
};
